import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import GLPIImportServiceFast from '../../../services/import/GLPIImportServiceFast';
import GLPIImageImportService from '../../../services/import/GLPIImageImportService';
import TicketService from '../../../services/Ticket/TicketService';
import ItemTicketService from '../../../services/ItemTicket/ItemTicketService';
import TicketCostService from '../../../services/TicketCost/TicketCostService';
import { Package, Eye, ShoppingCart, CheckCircle2, AlertCircle, Terminal, Upload, Image as ImageIcon } from 'lucide-react';
import '../../../styles/Import.css';

/**
 * COMPOSANT : FileField
 */
const FileField = ({ label, icon: Icon, file, count, onChange, accept = ".csv", isImporting }) => (
  <div className={`import-field ${file ? 'import-field--ok' : ''} ${isImporting ? 'import-field--disabled' : ''}`}>
    <div className="import-field__label">
      <Icon size={18} />
      <span>{label}</span>
    </div>
    <div className="import-field__input-wrapper">
      <input 
        type="file" 
        accept={accept} 
        onChange={onChange} 
        disabled={isImporting} 
        className="import-field__file-input-overlay"
      />
      <div className="import-field__info">
        {file ? (
          <div className="import-field__info-left">
            <CheckCircle2 size={24} color="#16a34a" />
            <span className="import-field__filename">{file.name}</span>
            {count !== undefined && <span className="import-field__count">({count} lignes)</span>}
          </div>
        ) : (
          <div className="import-field__placeholder">
            <Upload size={24} />
            <span>Choisir un fichier</span>
          </div>
        )}
      </div>
    </div>
  </div>
);

const GLPIImportPage = () => {
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [file3, setFile3] = useState(null);
  const [fileImages, setFileImages] = useState(null);

  const [preview1, setPreview1] = useState({ headers: [], rows: [] });
  const [preview2, setPreview2] = useState({ headers: [], rows: [] });
  const [preview3, setPreview3] = useState({ headers: [], rows: [] });

  const [isImporting, setIsImporting] = useState(false);
  const [results, setResults] = useState({ success: 0, errors: 0, details: [] });
  const [progress, setProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState([]);
  const [messages, setMessages] = useState([]);

  const addMessage = (msg, type = 'info') => {
    setMessages((prev) => [...prev, { msg, type, timestamp: new Date().toLocaleTimeString() }]);
  };

  const fileInputRef = React.useRef(null);

  const handleImportFile = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setIsImporting(true);
        const text = event.target.result;
        const lines = text.split('\n');
        
        for (const line of lines) {
          if (!line.trim()) continue;
          
          // Handle both comma and semicolon separators
          const separator = line.includes(';') ? ';' : ',';
          const parts = line.split(separator);
          
          // Skip header row if it contains 'ticket'
          if (parts[0].toLowerCase().includes('ticket')) continue;

          const ticketIdStr = parts[0];
          const action = parts[1] ? parts[1].trim().toLowerCase() : '';
          const valueStr = parts[2] ? parts[2].trim().replace(',', '.') : '0';
          const modeStr = parts[3] ? parts[3].trim() : '0';

          const ticketId = parseInt(ticketIdStr, 10);
          const value = parseFloat(valueStr);
          const mode = parseInt(modeStr, 10);

          if (isNaN(ticketId) || !action) continue;

          // Fetch linked items for distributing costs (for both open and close)
          let linkedItems = [];
          try {
            linkedItems = await ItemTicketService.getItemsForTicket(ticketId);
          } catch {
            console.error("Could not fetch items for ticket", ticketId);
          }
          const groupId = Date.now().toString() + Math.random().toString(36).substr(2, 5);

          if (action === 'open') {
            if (isNaN(value) || isNaN(mode)) continue;

            let baseCost;
             try {
                const res = await TicketCostService.calculateBaseCost(ticketId, mode);
                baseCost = res.base_cost || 0;
              } catch (error) {
                console.error("Error calculating base cost for ticket", ticketId, error);
                continue;
              }

            const calculatedCost = baseCost * (value / 100);

            if (linkedItems && linkedItems.length > 0) {
              const dividedCost = calculatedCost / linkedItems.length;
              for (const item of linkedItems) {
                await TicketCostService.saveCustomReopenCost(
                  ticketId, dividedCost, item.items_id, item.itemtype, groupId, value, mode, baseCost
                );
              }
            } else {
              await TicketCostService.saveCustomReopenCost(
                ticketId, calculatedCost, null, null, groupId, value, mode, baseCost
              );
            }

            // Update ticket status to In Progress (assigné) which is 2
            await TicketService.updateTicket(ticketId, { status: 2 });
          } else if (action === 'close') {
            // If value >= 0, we save a super cost (even if it's 0)
            if (!isNaN(value) && value >= 0) {
              if (linkedItems && linkedItems.length > 0) {
                const dividedCost = value / linkedItems.length;
                for (const item of linkedItems) {
                  await TicketCostService.saveSuperCost(ticketId, dividedCost, item.items_id, item.itemtype, groupId);
                }
              } else {
                await TicketCostService.saveSuperCost(ticketId, value, null, null, groupId);
              }
            }

            // Update ticket status to Terminé (6) and add a closing note
            try {
              const ticketObj = await TicketService.getTicket(ticketId);
              const currentContent = ticketObj.content || '';
              const formattedDate = new Date().toLocaleDateString('fr-FR');
              const closingNote = `\n\n[Clôture par Import - Date : ${formattedDate}]`;
              const updatedContent = currentContent + closingNote;
              
              await TicketService.updateTicket(ticketId, { 
                status: 6, 
                content: updatedContent 
              });
            } catch {
              // Fallback if we can't get current content
              await TicketService.updateTicket(ticketId, { status: 6 });
            }
          }
        }
        alert('Import terminé avec succès !');
      } catch (err) {
        console.error('Erreur lors de l\'import:', err);
        alert('Erreur lors de l\'import.');
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  // Parser simple pour CSV (gestion basique des guillemets)
  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length === 0) return { headers: [], rows: [] };
    
    // Une fonction très basique pour parser une ligne CSV
    const parseLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current);
      return result;
    };

    const headers = parseLine(lines[0]);
    const rows = lines.slice(1).map(parseLine);
    return { headers, rows };
  };

  const readAndParseCsv = (selectedFile, setPreviewState, validationFunction, errorPrefix) => {
    if (!selectedFile) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const parsed = parseCSV(text);
      setPreviewState(parsed);
      setResults({ success: 0, errors: 0, details: [] });
      setProgress(0);

      if (parsed.rows.length > 0) {
        const validation = validationFunction(parsed);
        setValidationErrors(prev => [...prev.filter(err => !err.startsWith(errorPrefix)), ...validation.errors.map(e => `${errorPrefix} ${e}`)]);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleFile1Change = (e) => {
    if (!e.target.files[0]) return;
    setFile1(e.target.files[0]);
    readAndParseCsv(e.target.files[0], setPreview1, GLPIImportServiceFast.validateItemFile, 'Fichier 1 (Équipements):');
  };

  const handleFile2Change = (e) => {
    if (!e.target.files[0]) return;
    setFile2(e.target.files[0]);
    readAndParseCsv(e.target.files[0], setPreview2, GLPIImportServiceFast.validateTicketFile, 'Fichier 2 (Tickets):');
  };

  const handleFile3Change = (e) => {
    if (!e.target.files[0]) return;
    setFile3(e.target.files[0]);
    readAndParseCsv(e.target.files[0], setPreview3, GLPIImportServiceFast.validateCostFile, 'Fichier 3 (Coûts):');
  };

  const handleFileImagesChange = (e) => {
    if (!e.target.files[0]) return;
    setFileImages(e.target.files[0]);
  };

  const handleImport = async () => {
    if (preview1.rows.length === 0 && preview2.rows.length === 0 && preview3.rows.length === 0 && !fileImages) return;
    if (validationErrors.length > 0) return;

    setIsImporting(true);
    setResults({ success: 0, errors: 0, details: [] });
    setMessages([]);
    addMessage("Initialisation de l'importation GLPI...", 'info');

    const newResults = { success: 0, errors: 0, details: [] };
    const totalRows = preview1.rows.length + preview2.rows.length + preview3.rows.length;
    let processed = 0;
    
    // Mapping pour lier Ref_Ticket (CSV) à l'ID GLPI réel
    const ticketMap = {};

    try {
      // 1. Équipements (Feuille 1)
      if (preview1.rows.length > 0) addMessage("Importation des équipements...", 'info');
      for (let i = 0; i < preview1.rows.length; i++) {
        const row = preview1.rows[i];
        try {
          await GLPIImportServiceFast.importItemRow(row);
          // row[4] correspond à l'Item_Type dans le CSV s'il est à l'index 4
          // Modifions le message pour qu'il soit dynamique
          const itemType = (row[4] && row[4].trim()) ? row[4].trim() : 'Computer';
          newResults.success++;
          addMessage(`${itemType} '${row[0]}' importé.`, 'success');
        } catch (error) {
          newResults.errors++;
          newResults.details.push({ row: i + 2, status: 'error', name: row[0], message: error.message });
        }
        processed++; setProgress(Math.round((processed / totalRows) * 100));
      }

      // 2. Tickets (Feuille 2)
      if (preview2.rows.length > 0) addMessage("Importation des tickets...", 'info');
      for (let i = 0; i < preview2.rows.length; i++) {
        const row = preview2.rows[i];
        const refTicket = row[0];
        try {
          const res = await GLPIImportServiceFast.importTicketRow(row);
          ticketMap[refTicket] = res.id; // Sauvegarde de l'ID réel
          newResults.success++;
          addMessage(`Ticket '${row[4]}' importé (GLPI ID: ${res.id}).`, 'success');
        } catch (error) {
          newResults.errors++;
          newResults.details.push({ row: preview1.rows.length + i + 2, status: 'error', name: row[4], message: error.message });
        }
        processed++; setProgress(Math.round((processed / totalRows) * 100));
      }

      // 3. Coûts (Feuille 3)
      if (preview3.rows.length > 0) addMessage("Importation des coûts...", 'info');
      for (let i = 0; i < preview3.rows.length; i++) {
        const row = preview3.rows[i];
        try {
          await GLPIImportServiceFast.importCostRow(row, ticketMap);
          newResults.success++;
          addMessage(`Coût pour le ticket réf '${row[0]}' importé.`, 'success');
        } catch (error) {
          newResults.errors++;
          newResults.details.push({ row: preview1.rows.length + preview2.rows.length + i + 2, status: 'error', name: `Ticket ${row[0]}`, message: error.message });
        }
        processed++; setProgress(Math.round((processed / totalRows) * 100));
      }

      // 4. Images (ZIP)
      if (fileImages) {
        addMessage("Extraction et importation des images...", 'info');
        try {
          const imageResults = await GLPIImageImportService.importImages(fileImages, () => {
            // onProgress update (optionnel)
          });
          newResults.success += imageResults.success;
          newResults.errors += imageResults.errors;
          newResults.details.push(...imageResults.details);
          
          imageResults.details.forEach(detail => {
            if (detail.status === 'success') {
              addMessage(`Image importée : ${detail.message}`, 'success');
            }
          });
        } catch (error) {
          addMessage(`Erreur lors de l'import des images: ${error.message}`, 'error');
        }
      }

    } catch (err) {
      addMessage(`Erreur critique: ${err.message}`, 'error');
    }

    setIsImporting(false);
    setProgress(100);
    setResults({ ...newResults });
    addMessage('Processus d\'importation terminé.', 'info');
  };

  return (
    <div className="import-page">
      <div className="import-header">
        <h1 className="import-title">Import GLPI (CSV)</h1>
        <p className="import-subtitle">Importez vos ordinateurs, tickets et coûts dans l'ordre chronologique.</p>
      </div>

      <div className="import-panel">
        <div className="import-panel__header">
          <h2 className="import-panel__title">Fichiers sources</h2>
          <p className="import-panel__subtitle">Sélectionnez les fichiers CSV ou ZIP pour lancer l'importation.</p>
        </div>

        <div className="import-panel__body">
          <div className="import-grid">
            <FileField label="1. Équipements (Feuille 1)" icon={Package} file={file1} count={preview1.rows.length} onChange={handleFile1Change} isImporting={isImporting} />
            <FileField label="2. Tickets (Feuille 2)" icon={Eye} file={file2} count={preview2.rows.length} onChange={handleFile2Change} isImporting={isImporting} />
            <FileField label="3. Coûts (Feuille 3)" icon={ShoppingCart} file={file3} count={preview3.rows.length} onChange={handleFile3Change} isImporting={isImporting} />
            <FileField label="4. Images (.zip)" icon={ImageIcon} file={fileImages} onChange={handleFileImagesChange} accept=".zip" isImporting={isImporting} />
          </div>

          {validationErrors.length > 0 && !isImporting && (
            <div className="import-alert import-alert--danger">
              <AlertCircle size={20} />
              <div>
                <div className="import-alert__title">Erreurs de validation ({validationErrors.length})</div>
                <ul className="import-alert__list">
                  {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            </div>
          )}

          {isImporting && (
            <div className="import-progress-box">
              <div className="import-progress-box__header">
                <span>Importation en cours...</span>
                <span>{progress}%</span>
              </div>
              <div className="import-progress-bar">
                <div className="import-progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          )}

          {results.details.length > 0 && !isImporting && (
            <div className={`import-results ${results.errors > 0 ? 'import-results--error' : 'import-results--ok'}`}>
              <div className={`import-results__header ${results.errors > 0 ? 'import-results__header--error' : 'import-results__header--ok'}`}>
                <span>Rapport : {results.success} succès — {results.errors} erreurs</span>
              </div>
              {results.errors > 0 && (
                <div className="import-results__body">
                  {results.details.filter(d => d.status === 'error').map((err, i) => (
                    <div key={i} className="import-results__item">
                      <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong className="import-results__item-title">Ligne {err.row} {err.name ? `(${err.name})` : ''}</strong>
                        <div className="import-results__item-msg">{err.message}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {(file1 || file2 || file3 || fileImages) && !isImporting && (
            <div className="import-footer-actions">
              <button 
                onClick={handleImport}
                disabled={validationErrors.length > 0}
                className="btn-import btn-import--primary"
              >
                Démarrer l'import
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="import-terminal">
        <h3 className="import-terminal__header">
          <Terminal size={20} />
          <span>Journal Technique</span>
        </h3>
        <div className="import-terminal__logs">
          {messages.map((msg, index) => (
            <div key={index} className={`import-terminal__line import-terminal__line--${msg.type}`}>
              <span className="import-terminal__timestamp">[{msg.timestamp}]</span>
              {msg.msg}
            </div>
          ))}
          {messages.length === 0 && <div className="import-terminal__placeholder">En attente d'actions...</div>}
        </div>
      </div>
    </div>
  );
};

export default GLPIImportPage;
