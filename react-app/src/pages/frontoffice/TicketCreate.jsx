import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import TicketService from '../../services/Ticket/TicketService';
import ItemTicketService from '../../services/ItemTicket/ItemTicketService';
import FrontOfficeLayout from '../../layouts/FrontOfficeLayout';
import ComputerService from '../../services/Computer/ComputerService';
import MonitorService from '../../services/Monitor/MonitorService';
import SoftwareService from '../../services/Software/SoftwareService';
import PrinterService from '../../services/Printer/PrinterService';
import PDUService from '../../services/PDU/PDUService';
import RackService from '../../services/Rack/RackService';
import PhoneService from '../../services/Phone/PhoneService';
import ChassisService from '../../services/Chassis/ChassisService';
import NetworkEquipmentService from '../../services/NetworkEquipment/NetworkEquipmentService';
import SoftwareLicenseService from '../../services/SoftwareLicense/SoftwareLicenseService';
import PeripheralService from '../../services/Peripheral/PeripheralService';
import PassiveDCEquipmentService from '../../services/PassiveDCEquipment/PassiveDCEquipmentService';
import CartridgeItemService from '../../services/CartridgeItem/CartridgeItemService';
import ConsumableItemService from '../../services/ConsumableItem/ConsumableItemService';
import CableService from '../../services/Cable/CableService';
import DatabaseInstanceService from '../../services/DatabaseInstance/DatabaseInstanceService';
import DCRoomService from '../../services/DCRoom/DCRoomService';
import ManufacturerService from '../../services/Manufacturer/ManufacturerService';
import LocationService from '../../services/Location/LocationService';
import StateService from '../../services/State/StateService';
import ComputerModelService from '../../services/ComputerModel/ComputerModelService';
import { getTicketItemTypes } from '../../config/itemTypes';
import '../../styles/FrontOffice.css';

const TicketCreate = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    content: '',
    type: 2, // 2 = Incident par défaut
    status: 1, // 1 = Nouveau
    priority: 3, // 3 = Moyenne
  });

  const [linkedItems, setLinkedItems] = useState([]); // Éléments sélectionnés, format: [{ id, itemType, name, typeLabel }]
  const [itemRows, setItemRows] = useState([]); // Lignes pour ajouter des éléments, format: [{ tempId, itemType, itemId }]
  const [allItemsByType, setAllItemsByType] = useState({}); // Tous les éléments triés par type
  const [loading, setLoading] = useState(false);
  const [fetchingItems, setFetchingItems] = useState(true);
  
  // Related data maps
  const [relatedData, setRelatedData] = useState({
    manufacturers: {},
    locations: {},
    states: {},
    computerModels: {}
  });

  const priorityOptions = [
    { value: 1, label: 'Très basse' },
    { value: 2, label: 'Basse' },
    { value: 3, label: 'Moyenne' },
    { value: 4, label: 'Haute' },
    { value: 5, label: 'Très haute' },
    { value: 6, label: 'Majeure' },
  ];

  const typeOptions = [
    { value: 1, label: 'Demande' },
    { value: 2, label: 'Incident' },
  ];

  const itemTypeOptions = getTicketItemTypes().map(type => ({
    value: type.itemType,
    label: type.label
  }));

  // Fonction pour générer un ID temporaire pour les lignes
  const generateTempId = () => Date.now() + Math.random().toString(36).substr(2, 9);

  // Helper pour convertir objet en tableau si nécessaire
  const toArray = (data) => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') return Object.values(data);
    return [];
  };

  // Récupérer tous les éléments triés par type
  const fetchAllItems = async () => {
    setFetchingItems(true);
    try {
      const ticketTypes = getTicketItemTypes();
      
      // Map config types to their respective service methods
      const serviceMap = {
        Computer: ComputerService.getAllComputers,
        Monitor: MonitorService.getAllMonitors,
        Software: SoftwareService.getAllSoftware,
        Printer: PrinterService.getAllPrinters,
        Pdu: PDUService.getAllPDUs,
        Rack: RackService.getAllRacks,
        Phone: PhoneService.getAllPhones,
        Enclosure: ChassisService.getAllChassis,
        NetworkEquipment: NetworkEquipmentService.getAllNetworkEquipment,
        SoftwareLicense: SoftwareLicenseService.getAllSoftwareLicenses,
        Peripheral: PeripheralService.getAllPeripherals,
        PassiveDCEquipment: PassiveDCEquipmentService.getAllPassiveDCEquipments,
        CartridgeItem: CartridgeItemService.getAllCartridgeItems,
        ConsumableItem: ConsumableItemService.getAllConsumableItems,
        Cable: CableService.getAllCables,
        DatabaseInstance: DatabaseInstanceService.getAllDatabaseInstances,
        DCRoom: DCRoomService.getAllDCRooms
      };

      // Fetch items for all ticket types
      const itemPromises = ticketTypes.map(type => 
        serviceMap[type.itemType] ? serviceMap[type.itemType]() : Promise.resolve([])
      );

      // Fetch related data
      const [manufacturers, locations, states, computerModels] = await Promise.all([
        ManufacturerService.getAllManufacturers(),
        LocationService.getAllLocations(),
        StateService.getAllStates(),
        ComputerModelService.getAllComputerModels()
      ]);

      // Wait for all item fetches
      const itemsResults = await Promise.all(itemPromises);

      // Build itemsByType object
      const itemsByType = {};
      ticketTypes.forEach((type, index) => {
        itemsByType[type.itemType] = toArray(itemsResults[index]);
      });

      // Create maps for quick lookup
      const manufacturersMap = {};
      toArray(manufacturers).forEach(m => manufacturersMap[m.id] = m.name);
      
      const locationsMap = {};
      toArray(locations).forEach(l => locationsMap[l.id] = l.name);
      
      const statesMap = {};
      toArray(states).forEach(s => statesMap[s.id] = s.name);
      
      const computerModelsMap = {};
      toArray(computerModels).forEach(cm => computerModelsMap[cm.id] = cm.name);

      setAllItemsByType(itemsByType);
      setRelatedData({
        manufacturers: manufacturersMap,
        locations: locationsMap,
        states: statesMap,
        computerModels: computerModelsMap
      });
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setFetchingItems(false);
    }
  };

  useEffect(() => {
    fetchAllItems();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Ajouter une nouvelle ligne
  const handleAddRow = () => {
    setItemRows(prev => [...prev, { tempId: generateTempId(), itemType: '', itemId: '' }]);
  };

  // Mettre à jour une ligne
  const handleRowChange = (tempId, field, value) => {
    setItemRows(prev => prev.map(row => 
      row.tempId === tempId ? { 
        ...row, 
        [field]: value, 
        itemId: field === 'itemType' ? '' : (field === 'itemId' ? value : row.itemId)
      } : row
    ));
  };

  // Supprimer une ligne
  const handleRemoveRow = (tempId) => {
    setItemRows(prev => prev.filter(row => row.tempId !== tempId));
  };

  // Ajouter une ligne en cours à la liste des éléments associés
  const handleAddLinkedItemFromRow = (tempId) => {
    const row = itemRows.find(r => r.tempId === tempId);
    if (!row || !row.itemType || !row.itemId) {
      alert('Veuillez sélectionner un type et un élément !');
      return;
    }
    const items = allItemsByType[row.itemType];
    const item = items.find(i => String(i.id) === String(row.itemId));
    if (!item) {
      alert('Élément introuvable !');
      return;
    }
    // Vérifier si l'élément n'est pas déjà dans la liste
    const alreadyExists = linkedItems.some(
      linked => linked.id === item.id && linked.itemType === row.itemType
    );
    if (alreadyExists) {
      alert('Cet élément est déjà associé au ticket !');
      return;
    }
    // Ajouter l'élément à la liste
    setLinkedItems(prev => [...prev, {
      id: item.id,
      itemType: row.itemType,
      name: item.name || `ID: ${item.id}`,
      typeLabel: itemTypeOptions.find(t => t.value === row.itemType)?.label || row.itemType,
    }]);
    // Supprimer la ligne après ajout
    setItemRows(prev => prev.filter(r => r.tempId !== tempId));
  };

  // Retirer un élément déjà ajouté
  const handleRemoveLinkedItem = (index) => {
    setLinkedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Collect ALL items to link: existing linkedItems + new complete rows
    const allItemsToLink = [...linkedItems];
    const itemsToAdd = [];
    const rowsToKeep = [];

    // Process each row
    for (const row of itemRows) {
      if (row.itemType && row.itemId) {
        // Complete row, add to itemsToLink
        const itemData = allItemsByType[row.itemType]?.find(i => String(i.id) === String(row.itemId));
        if (itemData) {
          // Check if not already in allItemsToLink
          const alreadyExists = allItemsToLink.some(i => i.id === itemData.id && i.itemType === row.itemType);
          if (!alreadyExists) {
            allItemsToLink.push({
              id: itemData.id,
              itemType: row.itemType,
              name: itemData.name || `ID: ${itemData.id}`,
              typeLabel: itemTypeOptions.find(t => t.value === row.itemType)?.label || row.itemType,
            });
            itemsToAdd.push(row);
          }
        }
      } else {
        // Incomplete row, keep it
        rowsToKeep.push(row);
      }
    }

    // Update the states for next time
    if (itemsToAdd.length > 0) {
      setLinkedItems(allItemsToLink);
      setItemRows(rowsToKeep);
    }

    try {
      // Create new ticket
      const ticket = await TicketService.createTicket(formData);
      const ticketId = ticket.id;

      if (!ticketId) {
        throw new Error('No ticket ID returned from createTicket');
      }

      // Link all collected items
      for (const item of allItemsToLink) {
        await ItemTicketService.linkItemToTicket(ticketId, item.id, item.itemType);
      }

      navigate('/frontoffice/tickets');
    } catch (error) {
      console.error('Error saving ticket:', error);
      alert('Erreur lors de la sauvegarde du ticket: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FrontOfficeLayout>
      <div className="frontoffice-page ticket-form-page">
        <div className="form-header">
          <Link to="/frontoffice/tickets" className="back-btn-form">
            <ArrowLeft size={18} />
            Retour
          </Link>
          <h1>Créer un ticket</h1>
        </div>

        <form onSubmit={handleSubmit} className="ticket-form">
          <div className="form-section">
            <h2>Informations du ticket</h2>

            <div className="form-group">
              <label>Titre</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Titre du ticket"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                required
                placeholder="Description du problème"
                rows={5}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Type</label>
                <select name="type" value={formData.type} onChange={handleInputChange}>
                  {typeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Priorité</label>
                <select name="priority" value={formData.priority} onChange={handleInputChange}>
                  {priorityOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Éléments associés</h2>

            <div className="linked-items-section">
              <h3>Éléments déjà ajoutés ({linkedItems.length})</h3>
              {linkedItems.length > 0 ? (
                <div className="added-items-table-container">
                  <table className="added-items-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Nom</th>
                        <th>Fabricant</th>
                        <th>Modèle</th>
                        <th>Numéro de série</th>
                        <th>Lieu</th>
                        <th>Statut</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linkedItems.map((item, index) => {
                        // Find full item details from allItemsByType
                        const fullItem = allItemsByType[item.itemType]?.find(i => String(i.id) === String(item.id));
                        return (
                          <tr key={index} className="added-item-row">
                            <td>
                              <span className="item-type-badge">{item.typeLabel}</span>
                            </td>
                            <td className="item-name-cell">
                              {fullItem?.name || item.name}
                            </td>
                            <td>
                              {fullItem?.manufacturers_id ? relatedData.manufacturers[fullItem.manufacturers_id] || '-' : '-'}
                            </td>
                            <td>
                              {fullItem?.computermodels_id ? relatedData.computerModels[fullItem.computermodels_id] || '-' : (fullItem?.monitormodels_id ? `Modèle ID: ${fullItem.monitormodels_id}` : '-')}
                            </td>
                            <td>
                              {fullItem?.serial || '-'}
                            </td>
                            <td>
                              {fullItem?.locations_id ? relatedData.locations[fullItem.locations_id] || '-' : '-'}
                            </td>
                            <td>
                              {fullItem?.states_id ? relatedData.states[fullItem.states_id] || '-' : '-'}
                            </td>
                            <td>
                              <button
                                type="button"
                                onClick={() => handleRemoveLinkedItem(index)}
                                className="remove-item-btn"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state small">Aucun élément ajouté</div>
              )}

              <h3>Ajouter des éléments</h3>
              <div className="items-rows-container">
                {itemRows.map((row) => (
                  <div key={row.tempId} className="item-row">
                    <div className="form-group row-field">
                      <select
                        value={row.itemType}
                        onChange={(e) => handleRowChange(row.tempId, 'itemType', e.target.value)}
                        className="item-type-select"
                      >
                        <option value="">-- Sélectionner un type --</option>
                        {itemTypeOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group row-field">
                      <select
                        value={String(row.itemId || '')}
                        onChange={(e) => handleRowChange(row.tempId, 'itemId', e.target.value)}
                        disabled={!row.itemType}
                        className="item-select"
                      >
                        <option value="">-- Sélectionner un élément --</option>
                        {row.itemType && allItemsByType[row.itemType]?.map((item) => (
                          <option key={item.id} value={String(item.id)}>{item.name || `ID: ${item.id}`}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddLinkedItemFromRow(row.tempId)}
                      className="add-item-btn"
                      title="Ajouter l'élément"
                    >
                      <Plus size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(row.tempId)}
                      className="remove-row-btn"
                      title="Supprimer la ligne"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="add-row-btn"
                >
                  <Plus size={16} />
                  Ajouter une ligne
                </button>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <Link to="/frontoffice/tickets" className="btn-cancel">
              Annuler
            </Link>
            <button type="submit" disabled={loading} className="btn-save">
              {loading ? 'Enregistrement...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </FrontOfficeLayout>
  );
};

export default TicketCreate;