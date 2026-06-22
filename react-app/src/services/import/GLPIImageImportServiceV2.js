import JSZip from 'jszip';
import api, { initSession } from '../../config/api';
import GLPIImportServiceFast from './GLPIImportServiceFast';
import TicketService from '../Ticket/TicketService';
import TicketCostService from '../TicketCost/TicketCostService';
import ItemTicketService from '../ItemTicket/ItemTicketService';
import ImportValidationService from './ImportValidationService';

/**
 * SERVICE : GLPIImportServiceV2
 * RÔLE    : Importe les 4 types de données (Équipements, Tickets, Coûts, Images)
 *           avec un système de ROLLBACK automatique inspiré du pattern PrestaShop.
 *
 * Principe du rollback :
 *   - Un rollbackStack GLOBAL enregistre chaque ressource créée.
 *   - Si une erreur CRITIQUE survient (ex: création d'un ticket après que des
 *     équipements ont été créés), on peut annuler tout ce qui a été fait.
 *   - Pour les images : rollback LOCAL par image (un document orphelin est supprimé
 *     si la liaison Document_Item échoue).
 *
 * Types de ressources rollbackables :
 *   'item'     → DELETE /{itemType}/{id}
 *   'ticket'   → DELETE /Ticket/{id}
 *   'cost'     → DELETE /TicketCost/{id}
 *   'document' → DELETE /Document/{id}
 */

// ─────────────────────────────────────────────
// HELPER : Conversion PNG → JPEG
// ─────────────────────────────────────────────
const convertPngToJpeg = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(objectUrl);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error(`Conversion PNG→JPEG échouée pour ${file.name}`));
            return;
          }
          const jpegName = file.name.replace(/\.png$/i, '.jpg');
          resolve(new File([blob], jpegName, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        0.92
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Impossible de charger l'image PNG : ${file.name}`));
    };
    img.src = objectUrl;
  });
};

// ─────────────────────────────────────────────
// TYPES D'ÉQUIPEMENTS GLPI pour les images
// ─────────────────────────────────────────────
const IMAGE_ITEM_TYPES = [
  'Computer', 'Monitor', 'Printer', 'NetworkEquipment',
  'Phone', 'Peripheral', 'PDU', 'Rack', 'Software',
];

// ─────────────────────────────────────────────
// SERVICE PRINCIPAL
// ─────────────────────────────────────────────
const GLPIImportServiceV2 = {

  // ════════════════════════════════════════════
  // ROLLBACK — suppression des ressources créées
  // ════════════════════════════════════════════

  /**
   * Supprime une ressource créée selon son type.
   * @param {{ type: string, id: number|string, itemType?: string }} entry
   */
  deleteResource: async (entry) => {
    const { type, id, itemType } = entry;
    try {
      switch (type) {
        case 'item':
          await api.delete(`/${itemType}/${id}`);
          break;
        case 'ticket':
          await api.delete(`/Ticket/${id}`);
          break;
        case 'cost':
          await api.delete(`/TicketCost/${id}`);
          break;
        case 'document':
          await api.delete(`/Document/${id}`);
          break;
        default:
          console.warn(`[Rollback] Type inconnu: ${type}`);
          return false;
      }
      console.log(`🗑️ [Rollback] ${type} ID=${id} supprimé.`);
      return true;
    } catch (e) {
      console.warn(`⚠️ [Rollback] Impossible de supprimer ${type} ID=${id}: ${e.message}`);
      return false;
    }
  },

  /**
   * Exécute un rollback complet sur un stack donné.
   * @param {Array} stack
   * @param {Function} onLog
   * @returns {number} nombre de ressources supprimées
   */
  runRollback: async (stack, onLog = null) => {
    if (stack.length === 0) return 0;
    const log = onLog || ((m) => console.warn(m));
    log(`🚨 Rollback — suppression de ${stack.length} ressource(s)...`, 'warn');

    let deleted = 0;
    for (const entry of [...stack].reverse()) {
      const ok = await GLPIImportServiceV2.deleteResource(entry);
      if (ok) deleted++;
    }
    stack.length = 0; // vider le stack
    log(`✅ Rollback terminé — ${deleted} ressource(s) supprimée(s).`, 'info');
    return deleted;
  },

  // ════════════════════════════════════════════
  // FEUILLE 1 — Équipements
  // ════════════════════════════════════════════

  /**
   * Importe une ligne équipement avec rollback.
   * @param {string[]} row
   * @param {Array}    globalStack  — stack global (pour rollback total si besoin)
   * @returns {{ id, itemType, name }}
   */
  // addToRollback est un callback (type, id, itemType?) — même pattern que PrestaShop
  importItemRow: async (row, addToRollback) => {
    const [name, status, location, manufacturer, itemType, model, inventoryNumber, user] = row;

    const states_id         = await GLPIImportServiceFast.resolveState(status);
    const locations_id      = await GLPIImportServiceFast.resolveLocation(location);
    const manufacturers_id  = await GLPIImportServiceFast.resolveManufacturer(manufacturer);
    const computermodels_id = await GLPIImportServiceFast.resolveComputerModel(model);
    const users_id          = await GLPIImportServiceFast.resolveUser(user);

    let validItemType = (itemType && itemType.trim()) ? itemType.trim() : 'Computer';
    if (validItemType === 'Database') {
      validItemType = 'DatabaseInstance';
    }

    const itemData = {
      name,
      otherserial: inventoryNumber,
      states_id: states_id || 0,
      locations_id: locations_id || 0,
      manufacturers_id: manufacturers_id || 0,
      [`${validItemType.toLowerCase()}models_id`]: computermodels_id || 0,
      users_id: users_id || 0,
    };

    // DCRoom requiert vis_rows et vis_cols (nombre de rangées/colonnes visibles)
    if (validItemType === 'DCRoom') {
      itemData.vis_rows = 1;
      itemData.vis_cols = 1;
    }

    const response = await api.post(`/${validItemType}`, { input: itemData });
    const newId = response.data?.id;

    if (newId && addToRollback) {
      addToRollback('item', newId, validItemType); // ← callback comme PrestaShop
    }

    return { id: newId, itemType: validItemType, name };
  },

  // ════════════════════════════════════════════
  // FEUILLE 2 — Tickets
  // ════════════════════════════════════════════

  /**
   * Importe une ligne ticket avec rollback.
   * @param {string[]} row
   * @param {Array}    globalStack
   * @returns {{ id, refTicket }}
   */
  importTicketRow: async (row, addToRollback) => {
    const [refTicket, date, heure, type, titre, description, status, priority, itemsStr] = row;

    // Formatage date
    const dateParts = date.split('/');
    let formattedDate = null;
    if (dateParts.length === 3) {
      const heureVal = heure && heure.trim() ? heure : '00:00:00';
      const timeParts = heureVal.split(':');
      const formattedTime = timeParts.length === 2 ? `${heureVal}:00` : heureVal;
      formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]} ${formattedTime}`;
    }

    const statusMap = {
      'New': 1,
      'Assign': 2,
      'Assigned': 2,
      'In Progress': 2,
      'In progress (assigned)': 2,
      'Planned': 3,
      'Pending': 4,
      'Solved': 5,
      'Resolved': 5,
      'Closed': 6
    };
    
    const priorityMap = {
      'Very Low': 1,
      'Low': 2,
      'Medium': 3,
      'High': 4,
      'Very High': 5,
      'Major': 6,
      'Critical': 6
    };

    const typeMap = {
      'Incident': 1,
      'Demande': 2,
      'Request': 2
    };

    // Make all lookups case-insensitive by trimming and lowercasing keys
    const getMapValue = (map, key) => {
      if (!key) return undefined;
      const normalizedKey = key.trim();
      // First try exact match
      if (map[normalizedKey]) return map[normalizedKey];
      // Then try case-insensitive match
      const lowerKey = normalizedKey.toLowerCase();
      for (const [mapKey, mapValue] of Object.entries(map)) {
        if (mapKey.toLowerCase() === lowerKey) return mapValue;
      }
      return undefined;
    };

    const targetStatusValue = getMapValue(statusMap, status) || 1;

    const ticketResponse = await TicketService.createTicket({
      name: titre,
      content: description,
      date: formattedDate,
      status: targetStatusValue === 6 ? 1 : targetStatusValue,
      priority: getMapValue(priorityMap, priority) || 3,
      type: getMapValue(typeMap, type) || 1,
    });
    const newTicketId = ticketResponse.id;

    if (newTicketId && addToRollback) {
      addToRollback('ticket', newTicketId); // ← callback comme PrestaShop
    }

    // Liaison des équipements au ticket (erreurs non bloquantes)
    if (itemsStr && itemsStr.trim()) {
      try {
        let cleanStr = itemsStr.trim();
        if (cleanStr.startsWith('"') && cleanStr.endsWith('"')) {
          cleanStr = cleanStr.substring(1, cleanStr.length - 1);
        }
        if (cleanStr.startsWith('[') && cleanStr.endsWith(']')) {
          cleanStr = cleanStr.replace(/""/g, '"');
          const content = cleanStr.substring(1, cleanStr.length - 1).trim();
          if (content) {
            const itemsList = content.split(',').map(item => {
              let i = item.trim().replace(/^"/, '').replace(/"$/, '');
              return `"${i}"`;
            });
            cleanStr = `[${itemsList.join(',')}]`;
          }
        } else {
          cleanStr = `["${cleanStr.replace(/"/g, '')}"]`;
        }
        const itemsArray = JSON.parse(cleanStr);
        // Pour dédoublonner les équipements et éviter l'erreur de doublon GLPI, décommentez la ligne ci-dessous :
        // const uniqueItems = Array.isArray(itemsArray) ? [...new Set(itemsArray)] : [];
        // et remplacez "itemsArray" par "uniqueItems" dans la boucle for ci-dessous.
        for (const itemRef of itemsArray) {
          const itemData = await GLPIImportServiceFast.resolveItem(itemRef);
          if (itemData) {
            await ItemTicketService.linkItemToTicket(newTicketId, itemData.id, itemData.type);
          }
        }
      } catch (e) {
        console.warn(`Erreur liaison items pour ticket ${titre}:`, e.message);
      }
    }

    // Si le statut final est Closed (6), on met à jour le ticket en Closed après la liaison
    if (targetStatusValue === 6) {
      try {
        await TicketService.updateTicket(newTicketId, {
          status: 6,
          solvedate: formattedDate,
          closedate: formattedDate
        });
      } catch (err) {
        console.error(`Erreur mise à jour statut Closed pour ticket ${newTicketId}:`, err);
      }
    }

    return { id: newTicketId, refTicket };
  },

  // ════════════════════════════════════════════
  // FEUILLE 3 — Coûts
  // ════════════════════════════════════════════

  /**
   * Importe une ligne coût avec rollback.
   * @param {string[]} row
   * @param {{ [ref]: id }} ticketMap   — map Ref → ID GLPI
   * @param {Array}    globalStack
   */
  importCostRow: async (row, ticketMap, addToRollback) => {
    const [numTicket, durationSecond, timeCost, fixedCost] = row;
    const realTicketId = ticketMap[numTicket];

    if (!realTicketId) {
      throw new Error(`Ticket correspondant introuvable pour Num_Ticket: ${numTicket}`);
    }

    const response = await TicketCostService.addCostToTicket(realTicketId, {
      name: 'Coût importé',
      actiontime: parseInt(durationSecond) || 0,
      cost_time: parseFloat(typeof timeCost === 'string' ? timeCost.replace(',', '.') : timeCost) || 0,
      cost_fixed: parseFloat(typeof fixedCost === 'string' ? fixedCost.replace(',', '.') : fixedCost) || 0,
    });

    if (response?.id && addToRollback) {
      addToRollback('cost', response.id); // ← callback comme PrestaShop
    }

    return { id: response?.id };
  },

  // ════════════════════════════════════════════
  // FEUILLE 4 — Images (ZIP)
  // ════════════════════════════════════════════

  extractImagesFromZip: async (zipFile) => {
    const zip = new JSZip();
    const contents = await zip.loadAsync(zipFile);
    const images = {};
    for (const [filename, fileEntry] of Object.entries(contents.files)) {
      if (fileEntry.dir) continue;
      const lower = filename.toLowerCase();
      if (!lower.endsWith('.png') && !lower.endsWith('.jpg') && !lower.endsWith('.jpeg')) continue;
      const baseName = filename.split('/').pop();
      const nameWithoutExt = baseName.replace(/\.(png|jpg|jpeg)$/i, '');
      const mimeType = lower.endsWith('.png') ? 'image/png' : 'image/jpeg';
      const blob = await fileEntry.async('blob');
      images[nameWithoutExt] = new File([blob], baseName, { type: mimeType });
    }
    return images;
  },

  findItemByName: async (name) => {
    await initSession();
    for (const itemtype of IMAGE_ITEM_TYPES) {
      try {
        const response = await api.get(`/${itemtype}`, {
          params: { searchText: name, range: '0-50' },
        });
        const items = Array.isArray(response.data) ? response.data : [];
        const found = items.find(
          (item) => item.name && item.name.toLowerCase() === name.toLowerCase()
        );
        if (found) return { id: found.id, itemtype };
      } catch (e) { /* type inexistant → on continue */ }
    }
    return null;
  },

  uploadDocument: async (imageFile, equipmentName, localStack) => {
    await initSession();
    let fileToUpload = imageFile;
    if (imageFile.name.toLowerCase().endsWith('.png')) {
      fileToUpload = await convertPngToJpeg(imageFile);
    }
    const formData = new FormData();
    formData.append('uploadManifest', JSON.stringify({
      input: { name: `Photo - ${equipmentName}`, _filename: [fileToUpload.name] },
    }));
    formData.append('filename[0]', fileToUpload, fileToUpload.name);

    const response = await api.post('/Document', formData, {
      headers: { 'Content-Type': undefined },
    });
    const documentId = response.data?.id || response.data?.[0]?.id;
    if (!documentId) {
      throw new Error(`Upload échoué pour ${fileToUpload.name} — pas d'ID retourné`);
    }
    // Enregistrer dans le stack LOCAL de cette image pour rollback si linkage échoue
    if (localStack) localStack.push({ type: 'document', id: documentId });
    return documentId;
  },

  /**
   * Importe toutes les images d'un ZIP avec rollback LOCAL par image.
   * Un document orphelin (uploadé mais non lié) est supprimé automatiquement.
   * @param {File}     zipFile
   * @param {Function} onLog     — callback(msg, type)
   * @param {Function} onProgress
   * @returns {{ success, errors, rollbackCount, details }}
   */
  importImages: async (zipFile, onLog = null, onProgress = null) => {
    const log = (msg, type = 'info') => { if (onLog) onLog(msg, type); };
    const images = await GLPIImportServiceV2.extractImagesFromZip(zipFile);
    const results = { success: 0, errors: 0, rollbackCount: 0, details: [] };
    const references = Object.keys(images);
    const total = references.length;
    let processed = 0;

    for (const name of references) {
      const localStack = []; // stack LOCAL à cette image

      try {
        const itemInfo = await GLPIImportServiceV2.findItemByName(name);

        if (!itemInfo) {
          results.errors++;
          results.details.push({ reference: name, status: 'error', message: `Équipement "${name}" introuvable dans GLPI` });
          log(`⚠️ "${name}" introuvable — image ignorée.`, 'warn');
        } else {
          const documentId = await GLPIImportServiceV2.uploadDocument(images[name], name, localStack);

          try {
            await initSession();
            await api.post('/Document_Item', {
              input: { documents_id: documentId, items_id: itemInfo.id, itemtype: itemInfo.itemtype },
            });
            localStack.length = 0; // succès → stack inutile
            results.success++;
            results.details.push({
              reference: name, itemtype: itemInfo.itemtype, itemId: itemInfo.id,
              documentId, status: 'success',
              message: `"${name}" → ${itemInfo.itemtype} ID=${itemInfo.id} (Doc ID=${documentId})`,
            });
            log(`✅ Image "${name}" importée.`, 'success');
          } catch (linkErr) {
            // Rollback local : suppression du document orphelin
            const deleted = await GLPIImportServiceV2.runRollback(localStack, onLog);
            results.rollbackCount += deleted;
            results.errors++;
            results.details.push({
              reference: name, status: 'error',
              message: `"${name}" : liaison échouée (${linkErr.message}) — document supprimé (rollback).`,
            });
            log(`❌ "${name}" : liaison échouée → rollback effectué.`, 'error');
          }
        }
      } catch (err) {
        const deleted = await GLPIImportServiceV2.runRollback(localStack, onLog);
        results.rollbackCount += deleted;
        results.errors++;
        results.details.push({ reference: name, status: 'error', message: `"${name}" : ${err.message}` });
        log(`❌ "${name}" : ${err.message}`, 'error');
      }

      processed++;
      if (onProgress) onProgress(Math.round((processed / total) * 100));
    }

    return results;
  },

  // ════════════════════════════════════════════
  // VALIDATION EN-TÊTES SEULEMENT (au chargement du fichier)
  // Ne bloque PAS le bouton si les données des lignes sont invalides.
  // Les erreurs de lignes sont catchées PENDANT l'import → rollback.
  // ════════════════════════════════════════════
  validateItemHeaders: (data) => ImportValidationService.validateCSVHeaders(
    data.headers,
    ['Name', 'Status', 'Location', 'Manufacturer', 'Item_Type', 'Model', 'Inventory_Number', 'User'],
    'Fichier Équipements'
  ),
  validateTicketHeaders: (data) => ImportValidationService.validateCSVHeaders(
    data.headers,
    ['Ref_Ticket', 'Date', 'Heure', 'Type', 'Titre', 'Description', 'Status', 'Priority', 'Items'],
    'Fichier Tickets'
  ),
  validateCostHeaders: (data) => ImportValidationService.validateCSVHeaders(
    data.headers,
    ['Num_Ticket', 'Duration_second', 'Time_Cost', 'Fixed_Cost'],
    'Fichier Coûts'
  ),

  // Validateurs complets (fichier + toutes lignes) — gardés pour compatibilité
  validateItemFile:   (data) => GLPIImportServiceFast.validateItemFile(data),
  validateTicketFile: (data) => GLPIImportServiceFast.validateTicketFile(data),
  validateCostFile:   (data) => GLPIImportServiceFast.validateCostFile(data),

  // Validateurs de ligne — utilisés dans la boucle for pendant l'import (→ rollback)
  validateItemRow:   (row, lineNumber) => ImportValidationService.validateItemRow(row, lineNumber),
  validateTicketRow: (row, lineNumber) => ImportValidationService.validateTicketRow(row, lineNumber),
  validateCostRow:   (row, lineNumber) => ImportValidationService.validateCostRow(row, lineNumber),
};

export default GLPIImportServiceV2;
