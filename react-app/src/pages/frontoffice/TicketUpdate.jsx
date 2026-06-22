import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, DollarSign } from 'lucide-react';
import TicketService from '../../services/Ticket/TicketService';
import ItemTicketService from '../../services/ItemTicket/ItemTicketService';
import TicketCostService from '../../services/TicketCost/TicketCostService';
import UserService from '../../services/User/UserService';
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

const TicketUpdate = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    content: '',
    type: 2,
    status: 1,
    priority: 3,
  });

  const [linkedItems, setLinkedItems] = useState([]);
  const [originalItems, setOriginalItems] = useState([]);
  const [itemRows, setItemRows] = useState([]);
  const [allItemsByType, setAllItemsByType] = useState({});
  const [ticketCosts, setTicketCosts] = useState([]);
  const [originalCosts, setOriginalCosts] = useState([]);
  const [costRows, setCostRows] = useState([]);
  const [costsToDelete, setCostsToDelete] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingItems, setFetchingItems] = useState(true);
  const [originalAssignees, setOriginalAssignees] = useState([]);
  const [assignees, setAssignees] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechId, setSelectedTechId] = useState('');
  
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
    { value: 1, label: 'Incident' },
    { value: 2, label: 'Demande' },
  ];

  const itemTypeOptions = getTicketItemTypes().map(type => ({
    value: type.itemType,
    label: type.label
  }));

  const generateTempId = () => Date.now() + Math.random().toString(36).substr(2, 9);

  const toArray = (data) => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') return Object.values(data);
    return [];
  };

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

  const fetchTicket = async () => {
    setLoading(true);
    try {
      const ticket = await TicketService.getTicket(id);
      console.log('Ticket data from API:', ticket);
      console.log('Ticket type:', ticket.type);
      console.log('All ticket fields:', Object.keys(ticket));
      
      setFormData({
        name: ticket.name,
        content: ticket.content,
        type: ticket.type,
        status: ticket.status,
        priority: ticket.priority,
      });

      const items = await ItemTicketService.getItemsForTicket(id);
      const mappedItems = items.map(item => ({
        id: item.items_id,
        itemType: item.itemtype,
        name: item.item?.name || `ID: ${item.items_id}`,
        typeLabel: itemTypeOptions.find(t => t.value === item.itemtype)?.label || item.itemtype,
        linkId: item.id,
      }));
      setLinkedItems(mappedItems);
      setOriginalItems(mappedItems);

      const costs = await TicketCostService.getTicketCosts(id);
      setTicketCosts(costs || []);
      setOriginalCosts(costs || []);

      const relationsData = await TicketService.getTicketUsers();
      const rels = Array.isArray(relationsData) ? relationsData : [];
      const ticketAssignees = rels.filter(
        rel => Number(rel.tickets_id) === Number(id) && Number(rel.type) === 2
      );
      setOriginalAssignees(ticketAssignees);
      setAssignees(ticketAssignees);
    } catch (error) {
      console.error('Error fetching ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllItems();

    const fetchUsers = async () => {
      try {
        const [u, profileUsers] = await Promise.all([
          UserService.getAllUsers(),
          UserService.getProfileUsers()
        ]);
        const uList = Array.isArray(u) ? u : [];
        const puList = Array.isArray(profileUsers) ? profileUsers : [];
        const assignableProfileIds = [3, 4, 5, 6, 7]; // Admin, Super-Admin, Hotliner, Technician, Supervisor
        const assignableUserIds = new Set(
          puList
            .filter(pu => assignableProfileIds.includes(Number(pu.profiles_id)))
            .map(pu => Number(pu.users_id))
        );
        const techUsers = uList.filter(user => assignableUserIds.has(Number(user.id)));
        setTechnicians(techUsers);
      } catch (err) {
        console.error('Error fetching users for assignees:', err);
      }
    };
    fetchUsers();

    if (id) {
      fetchTicket();
    }
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddRow = () => {
    setItemRows(prev => [...prev, { tempId: generateTempId(), itemType: '', itemId: '' }]);
  };

  const handleRowChange = (tempId, field, value) => {
    setItemRows(prev => prev.map(row => 
      row.tempId === tempId ? { 
        ...row, 
        [field]: value, 
        itemId: field === 'itemType' ? '' : (field === 'itemId' ? value : row.itemId)
      } : row
    ));
  };

  const handleRemoveRow = (tempId) => {
    setItemRows(prev => prev.filter(row => row.tempId !== tempId));
  };

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
    const alreadyExists = linkedItems.some(
      linked => linked.id === item.id && linked.itemType === row.itemType
    );
    if (alreadyExists) {
      alert('Cet élément est déjà associé au ticket !');
      return;
    }
    setLinkedItems(prev => [...prev, {
      id: item.id,
      itemType: row.itemType,
      name: item.name || `ID: ${item.id}`,
      typeLabel: itemTypeOptions.find(t => t.value === row.itemType)?.label || row.itemType,
    }]);
    setItemRows(prev => prev.filter(r => r.tempId !== tempId));
  };

  const handleRemoveLinkedItem = (index) => {
    setLinkedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddCostRow = () => {
    setCostRows(prev => [...prev, {
      tempId: generateTempId(),
      name: '',
      cost_fixed: '',
      cost_material: '',
      cost_time: '',
      duration_hours: '',
    }]);
  };

  const handleCostRowChange = (tempId, field, value) => {
    setCostRows(prev => prev.map(row => 
      row.tempId === tempId ? { ...row, [field]: value } : row
    ));
  };

  const handleRemoveCostRow = (tempId) => {
    setCostRows(prev => prev.filter(row => row.tempId !== tempId));
  };

  const handleRemoveExistingCost = (costId) => {
    setTicketCosts(prev => prev.filter(c => c.id !== costId));
    setCostsToDelete(prev => [...prev, costId]);
  };

  const handleAddAssigneeLocal = () => {
    if (!selectedTechId) return;
    const alreadyExists = assignees.some(rel => Number(rel.users_id) === Number(selectedTechId));
    if (alreadyExists) return;

    setAssignees(prev => [...prev, {
      id: `temp-${Date.now()}`,
      tickets_id: id,
      users_id: Number(selectedTechId),
      type: 2
    }]);
    setSelectedTechId('');
  };

  const handleRemoveAssigneeLocal = (relId, userId) => {
    setAssignees(prev => prev.filter(rel => Number(rel.users_id) !== Number(userId)));
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

    // Identify assignees to delete
    const assigneesToDelete = originalAssignees.filter(
      orig => !assignees.some(curr => Number(curr.users_id) === Number(orig.users_id))
    );

    // Identify assignees to add
    const assigneesToAdd = assignees.filter(
      curr => !originalAssignees.some(orig => Number(orig.users_id) === Number(curr.users_id))
    );

    try {
      // 1. Update ticket details
      await TicketService.updateTicket(id, formData);

      // Update assignees
      for (const rel of assigneesToDelete) {
        if (rel.id && !String(rel.id).startsWith('temp-')) {
          await TicketService.removeUserFromTicket(rel.id);
        }
      }

      for (const rel of assigneesToAdd) {
        await TicketService.assignUserToTicket(id, rel.users_id);
      }

      // 2. Identify items to unlink
      const itemsToUnlink = originalItems.filter(
        orig => !allItemsToLink.some(curr => String(curr.id) === String(orig.id) && curr.itemType === orig.itemType)
      );

      for (const item of itemsToUnlink) {
        if (item.linkId) {
          await ItemTicketService.unlinkItemFromTicket(item.linkId);
        }
      }

      // 3. Identify new items to link
      const newItemsToLink = allItemsToLink.filter(
        curr => !originalItems.some(orig => String(orig.id) === String(curr.id) && orig.itemType === curr.itemType)
      );

      for (const item of newItemsToLink) {
        await ItemTicketService.linkItemToTicket(id, item.id, item.itemType);
      }

      // 4. Delete removed costs
      for (const costId of costsToDelete) {
        await TicketCostService.deleteTicketCost(costId);
      }

      // 5. Add new costs from costRows
      for (const row of costRows) {
        if (row.name || row.cost_fixed || row.cost_material || row.cost_time || row.duration_hours) {
          const actiontime = Math.round((parseFloat(row.duration_hours) || 0) * 3600);
          const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
          await TicketCostService.addCostToTicket(id, {
            name: row.name || 'Coût ajouté via frontoffice',
            cost_fixed: parseFloat(row.cost_fixed) || 0,
            cost_material: parseFloat(row.cost_material) || 0,
            cost_time: parseFloat(row.cost_time) || 0,
            actiontime: actiontime,
            begin_date: nowStr,
            end_date: nowStr
          });
        }
      }

      navigate(`/frontoffice/tickets/${id}`);
    } catch (error) {
      console.error('Error saving ticket:', error);
      alert('Erreur lors de la sauvegarde du ticket: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const assignedTechIds = assignees.map(rel => Number(rel.users_id));
  const availableTechs = technicians.filter(
    tech => !assignedTechIds.includes(Number(tech.id))
  );

  return (
    <FrontOfficeLayout>
      <div className="frontoffice-page ticket-form-page">
        <div className="form-header">
          <Link to={`/frontoffice/tickets/${id}`} className="back-btn-form">
            <ArrowLeft size={18} />
            Retour
          </Link>
          <h1>Modifier le ticket</h1>
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

          <div className="form-section">
            <h2>Techniciens / Attributeurs</h2>
            <div className="linked-items-section">
              <h3>Techniciens actuellement attribués ({assignees.length})</h3>
              {assignees.length === 0 ? (
                <div className="empty-state small" style={{ marginBottom: '16px' }}>Aucun technicien attribué</div>
              ) : (
                <div className="added-items-table-container" style={{ marginBottom: '16px' }}>
                  <table className="added-items-table">
                    <thead>
                      <tr>
                        <th>Nom du technicien</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignees.map((rel, index) => {
                        const techObj = technicians.find(t => Number(t.id) === Number(rel.users_id));
                        return (
                          <tr key={index} className="added-item-row">
                            <td className="item-name-cell">
                              {techObj ? techObj.name : `Utilisateur #${rel.users_id}`}
                            </td>
                            <td>
                              <button
                                type="button"
                                onClick={() => handleRemoveAssigneeLocal(rel.id, rel.users_id)}
                                className="remove-item-btn"
                                title="Retirer ce technicien"
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
              )}

              <h3>Ajouter un technicien</h3>
              <div style={{ display: 'flex', gap: '8px', maxWidth: '450px', marginTop: '8px' }}>
                <select
                  value={selectedTechId}
                  onChange={(e) => setSelectedTechId(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="">-- Choisir un technicien --</option>
                  {availableTechs.map(tech => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddAssigneeLocal}
                  disabled={!selectedTechId}
                  className="add-row-btn"
                  style={{
                    margin: 0,
                    padding: '8px 16px',
                    backgroundColor: selectedTechId ? '#2563eb' : '#93c5fd',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: selectedTechId ? 'pointer' : 'not-allowed'
                  }}
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>
              <DollarSign size={20} style={{ marginRight: '8px', display: 'inline-block', verticalAlign: 'middle' }} />
              Coûts du ticket
            </h2>

            <div className="linked-items-section">
              <h3>Coûts existants ({ticketCosts.length})</h3>
              {ticketCosts.length > 0 ? (
                <div className="added-items-table-container">
                  <table className="added-items-table">
                    <thead>
                      <tr>
                        <th>Nom</th>
                        <th>Coût fixe (€)</th>
                        <th>Coût matériel (€)</th>
                        <th>Coût horaire (€)</th>
                        <th>Durée</th>
                        <th>Coût total (€)</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ticketCosts.map((cost) => {
                        const costFixed = parseFloat(cost.cost_fixed || 0);
                        const costMaterial = parseFloat(cost.cost_material || 0);
                        const hourlyRate = parseFloat(cost.cost_time || 0);
                        const durationHours = (parseInt(cost.actiontime) || 0) / 3600;
                        const timeCost = durationHours * hourlyRate;
                        const total = costFixed + costMaterial + timeCost;

                        const formatDuration = (seconds) => {
                          const secs = parseInt(seconds) || 0;
                          if (secs === 0) return '0 s';
                          const h = Math.floor(secs / 3600);
                          const m = Math.floor((secs % 3600) / 60);
                          const s = secs % 60;
                          const parts = [];
                          if (h > 0) parts.push(`${h} h`);
                          if (m > 0) parts.push(`${m} m`);
                          if (s > 0) parts.push(`${s} s`);
                          return parts.join(' ');
                        };

                        return (
                          <tr key={cost.id} className="added-item-row">
                            <td>{cost.name || 'Sans description'}</td>
                            <td>{costFixed.toFixed(2)} €</td>
                            <td>{costMaterial.toFixed(2)} €</td>
                            <td>{hourlyRate.toFixed(2)} €</td>
                            <td>{formatDuration(cost.actiontime)}</td>
                            <td style={{ fontWeight: 'bold' }}>{total.toFixed(2)} €</td>
                            <td>
                              <button
                                type="button"
                                onClick={() => handleRemoveExistingCost(cost.id)}
                                className="remove-item-btn"
                                title="Supprimer ce coût"
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
                <div className="empty-state small">Aucun coût enregistré</div>
              )}

              <h3>Saisir de nouveaux coûts</h3>
              <div className="costs-rows-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                {costRows.map((row) => (
                  <div key={row.tempId} className="cost-row-edit-card" style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '16px',
                    backgroundColor: '#f8fafc',
                    position: 'relative'
                  }}>
                    <button
                      type="button"
                      onClick={() => handleRemoveCostRow(row.tempId)}
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer'
                      }}
                      title="Supprimer la ligne"
                    >
                      <Trash2 size={18} />
                    </button>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginRight: '32px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>Nom / Description</label>
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => handleCostRowChange(row.tempId, 'name', e.target.value)}
                          placeholder="ex: Main d'œuvre"
                          style={{ padding: '8px', fontSize: '13px' }}
                        />
                      </div>
                      
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>Coût fixe (€)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={row.cost_fixed}
                          onChange={(e) => handleCostRowChange(row.tempId, 'cost_fixed', e.target.value)}
                          placeholder="0.00"
                          style={{ padding: '8px', fontSize: '13px' }}
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>Coût matériel (€)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={row.cost_material}
                          onChange={(e) => handleCostRowChange(row.tempId, 'cost_material', e.target.value)}
                          placeholder="0.00"
                          style={{ padding: '8px', fontSize: '13px' }}
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>Coût horaire (€)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={row.cost_time}
                          onChange={(e) => handleCostRowChange(row.tempId, 'cost_time', e.target.value)}
                          placeholder="0.00"
                          style={{ padding: '8px', fontSize: '13px' }}
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>Durée (heures)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={row.duration_hours}
                          onChange={(e) => handleCostRowChange(row.tempId, 'duration_hours', e.target.value)}
                          placeholder="1.5"
                          style={{ padding: '8px', fontSize: '13px' }}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddCostRow}
                  className="add-row-btn"
                  style={{ alignSelf: 'flex-start' }}
                >
                  <Plus size={16} />
                  Ajouter un coût
                </button>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <Link to={`/frontoffice/tickets/${id}`} className="btn-cancel">
              Annuler
            </Link>
            <button type="submit" disabled={loading} className="btn-save">
              {loading ? 'Enregistrement...' : 'Mettre à jour'}
            </button>
          </div>
        </form>
      </div>
    </FrontOfficeLayout>
  );
};

export default TicketUpdate;