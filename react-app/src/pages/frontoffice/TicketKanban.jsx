import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Ticket, X, Trash2, Plus, Settings } from 'lucide-react';
import TicketService from '../../services/Ticket/TicketService';
import ItemTicketService from '../../services/ItemTicket/ItemTicketService';
import AuthService from '../../services/AuthService';
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
import { getTicketItemTypes } from '../../config/itemTypes';
import SettingsService from '../../services/Settings/SettingsService';
import TicketCostService from '../../services/TicketCost/TicketCostService';
import '../../styles/FrontOffice.css';
import '../../styles/front/TicketKanban.css';

const TicketKanban = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [ticketRequesterMap, setTicketRequesterMap] = useState({});
  const [ticketUserRelations, setTicketUserRelations] = useState([]);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const currentUser = AuthService.getCurrentUser();
  const [quickTickets, setQuickTickets] = useState([
    {
      tempId: 'init-ticket-1',
      name: '',
      content: '',
      type: 1,
      priority: 3,
      users_id_recipient: currentUser?.id || '',
      itemRows: []
    }
  ]);
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const [allItemsByType, setAllItemsByType] = useState({});
  const [fetchingAllItems, setFetchingAllItems] = useState(false);
  const [closeModalData, setCloseModalData] = useState({
    isOpen: false,
    ticketId: null,
    comment: '',
    date: new Date().toISOString().split('T')[0],
    superCost: ''
  });
  const [reopenModalData, setReopenModalData] = useState({
    isOpen: false,
    ticketId: null,
    targetColumnId: null,
    showPercentage: false,
    percentage: '',
    mode: 1
  });
  const [assignModalData, setAssignModalData] = useState({
    isOpen: false,
    ticketId: null,
    selectedUserId: ''
  });
  const [kanbanSettings, setKanbanSettings] = useState({
    color_nouveau: '#3b82f6',
    color_inProgress: '#f59e0b',
    color_termine: '#10b981',
    label_nouveau: 'Nouveau',
    label_inProgress: 'In progress (assigné)',
    label_termine: 'Terminé'
  });

  const navigate = useNavigate();

  const priorityOptions = [
    { value: 1, label: 'Très basse', color: '#9e9e9e', bg: '#f5f5f5' },
    { value: 2, label: 'Basse', color: '#4caf50', bg: '#e8f5e9' },
    { value: 3, label: 'Moyenne', color: '#ff9800', bg: '#fff3e0' },
    { value: 4, label: 'Haute', color: '#f44336', bg: '#ffebee' },
    { value: 5, label: 'Très haute', color: '#9c27b0', bg: '#f3e5f5' },
    { value: 6, label: 'Majeure', color: '#b71c1c', bg: '#ffebee' },
  ];

  const statusOptions = [
    { value: 1, label: 'Nouveau', color: '#03a9f4', bg: '#e1f5fe' },
    { value: 2, label: 'Attribué', color: '#2196f3', bg: '#e3f2fd' },
    { value: 3, label: 'En attente', color: '#ffc107', bg: '#fffde7' },
    { value: 4, label: 'Résolu', color: '#4caf50', bg: '#e8f5e9' },
    { value: 5, label: 'Fermé', color: '#9e9e9e', bg: '#f5f5f5' },
  ];

  const typeOptions = [
    { value: 1, label: 'Incident', color: '#f44336', bg: '#ffebee' },
    { value: 2, label: 'Demande', color: '#2196f3', bg: '#e3f2fd' },
  ];

  const itemTypeOptions = getTicketItemTypes().map(type => ({
    value: type.itemType,
    label: type.label
  }));

  const getStatusInfo = (statusId) => {
    const option = statusOptions.find(opt => opt.value === statusId);
    return option || { label: 'Inconnu', color: '#9e9e9e', bg: '#f5f5f5' };
  };

  const getPriorityInfo = (priorityId) => {
    const option = priorityOptions.find(opt => opt.value === priorityId);
    return option || { label: 'Inconnu', color: '#9e9e9e', bg: '#f5f5f5' };
  };

  const getTypeInfo = (typeId) => {
    const option = typeOptions.find(opt => opt.value === typeId);
    return option || { label: 'Inconnu', color: '#9e9e9e', bg: '#f5f5f5' };
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const [result, relations] = await Promise.all([
        TicketService.getTickets({ start: 0, limit: 999 }),
        TicketService.getTicketUsers()
      ]);

      const userTicketsList = result.tickets || [];
      const rels = Array.isArray(relations) ? relations : [];

      const reqMap = {};
      rels.forEach(rel => {
        if (Number(rel.type) === 1) {
          reqMap[rel.tickets_id] = rel.users_id;
        }
      });
      setTicketRequesterMap(reqMap);
      setTicketUserRelations(rels);

      let userTickets = [...userTicketsList];

      // Filter for current user's tickets (where current user is creator/recipient OR requester)
      if (currentUser?.id) {
        userTickets = userTickets.filter(t => {
          const reqId = reqMap[t.id];
          return Number(t.users_id_recipient) === Number(currentUser.id) || 
                 (reqId && Number(reqId) === Number(currentUser.id));
        });
      }

      setTickets(userTickets);
    } catch (error) {
      console.error('Error fetching tickets for Kanban:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllItems = async () => {
    setFetchingAllItems(true);
    try {
      const ticketTypes = getTicketItemTypes();
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

      const itemPromises = ticketTypes.map(type => 
        serviceMap[type.itemType] ? serviceMap[type.itemType]() : Promise.resolve([])
      );

      const itemsResults = await Promise.all(itemPromises);
      const itemsByType = {};
      ticketTypes.forEach((type, index) => {
        const data = itemsResults[index];
        itemsByType[type.itemType] = Array.isArray(data) ? data : (data && typeof data === 'object' ? Object.values(data) : []);
      });

      setAllItemsByType(itemsByType);
    } catch (error) {
      console.error('Error fetching items for quick add:', error);
    } finally {
      setFetchingAllItems(false);
    }
  };

  const fetchKanbanSettings = async () => {
    try {
      const data = await SettingsService.getSettings();
      setKanbanSettings({
        color_nouveau: data.color_nouveau || '#3b82f6',
        color_inProgress: data.color_inProgress || '#f59e0b',
        color_termine: data.color_termine || '#10b981',
        label_nouveau: data.label_nouveau || 'Nouveau',
        label_inProgress: data.label_inProgress || 'In progress (assigné)',
        label_termine: data.label_termine || 'Terminé'
      });
    } catch (err) {
      console.error('Error loading Kanban settings from SQLite:', err);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchAllItems();
    fetchKanbanSettings();

    const fetchUsers = async () => {
      try {
        const [u, profileUsers] = await Promise.all([
          UserService.getAllUsers(),
          UserService.getProfileUsers()
        ]);
        const uList = Array.isArray(u) ? u : [];
        setUsers(uList);

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
        console.error('Error fetching users:', err);
      }
    };
    fetchUsers();
  }, [currentUser?.id]);

  const generateTempId = () => Date.now() + Math.random().toString(36).substr(2, 9);

  const openQuickAdd = () => {
    setQuickTickets([
      {
        tempId: generateTempId(),
        name: '',
        content: '',
        type: 1,
        priority: 3,
        users_id_recipient: currentUser?.id || '',
        itemRows: []
      }
    ]);
    setShowQuickAdd(true);
  };

  const handleAddQuickTicket = () => {
    setQuickTickets(prev => [...prev, {
      tempId: generateTempId(),
      name: '',
      content: '',
      type: 1,
      priority: 3,
      users_id_recipient: currentUser?.id || '',
      itemRows: []
    }]);
  };

  const handleRemoveQuickTicket = (ticketTempId) => {
    setQuickTickets(prev => prev.filter(t => t.tempId !== ticketTempId));
  };

  const handleQuickTicketChange = (ticketTempId, field, value) => {
    setQuickTickets(prev => prev.map(t => 
      t.tempId === ticketTempId ? { ...t, [field]: value } : t
    ));
  };

  const handleAddQuickRow = (ticketTempId) => {
    setQuickTickets(prev => prev.map(t => 
      t.tempId === ticketTempId 
        ? { ...t, itemRows: [...t.itemRows, { tempId: generateTempId(), itemType: '', itemId: '' }] }
        : t
    ));
  };

  const handleQuickRowChange = (ticketTempId, rowTempId, field, value) => {
    setQuickTickets(prev => prev.map(t => 
      t.tempId === ticketTempId 
        ? { 
            ...t, 
            itemRows: t.itemRows.map(row => 
              row.tempId === rowTempId 
                ? { 
                    ...row, 
                    [field]: value, 
                    itemId: field === 'itemType' ? '' : (field === 'itemId' ? value : row.itemId)
                  } 
                : row
            )
          }
        : t
    ));
  };

  const handleRemoveQuickRow = (ticketTempId, rowTempId) => {
    setQuickTickets(prev => prev.map(t => 
      t.tempId === ticketTempId 
        ? { ...t, itemRows: t.itemRows.filter(row => row.tempId !== rowTempId) }
        : t
    ));
  };

  const handleQuickAddSubmit = async (e) => {
    if (e) e.preventDefault();
    
    const hasInvalid = quickTickets.some(t => !t.name.trim() || !t.content.trim());
    if (hasInvalid) {
      alert('Veuillez remplir le titre et la description pour tous les tickets.');
      return;
    }

    setQuickSubmitting(true);
    try {
      for (const t of quickTickets) {
        const payload = {
          name: t.name.trim(),
          content: t.content.trim(),
          type: Number(t.type),
          status: 1, // Nouveau
          priority: Number(t.priority),
          users_id_recipient: currentUser?.id || 0,
          _users_id_requester: Number(t.users_id_recipient) || currentUser?.id || 0,
        };

        const ticketRes = await TicketService.createTicket(payload);
        const ticketId = ticketRes.id;

        if (ticketId && t.itemRows.length > 0) {
          for (const row of t.itemRows) {
            if (row.itemType && row.itemId) {
              await ItemTicketService.linkItemToTicket(ticketId, row.itemId, row.itemType);
            }
          }
        }
      }

      // Reset form
      setQuickTickets([
        {
          tempId: generateTempId(),
          name: '',
          content: '',
          type: 1,
          priority: 3,
          users_id_recipient: currentUser?.id || '',
          itemRows: []
        }
      ]);
      setShowQuickAdd(false);

      // Refresh tickets list
      await fetchTickets();
    } catch (err) {
      console.error('Error in quick ticket creation:', err);
      alert('Erreur lors de la création du ticket: ' + err.message);
    } finally {
      setQuickSubmitting(false);
    }
  };

  const handleDragStart = (e, ticketId, fromColumnId) => {
    e.dataTransfer.setData('text/plain', ticketId);
    e.dataTransfer.setData('fromColumn', fromColumnId);
  };

  const handleCancelSuperCost = async (ticketId, targetColumnId) => {
    try {
      setLoading(true);
      await TicketCostService.deleteSuperCost(ticketId);
      setReopenModalData(prev => ({ ...prev, isOpen: false }));
      if (targetColumnId === 'inProgress') {
        await TicketService.updateTicket(ticketId, { status: 2 });
        await fetchTickets();
        setAssignModalData({ isOpen: true, ticketId: ticketId, selectedUserId: '' });
      } else {
        await TicketService.updateTicket(ticketId, { status: 1 });
        await fetchTickets();
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleReopenTicket = async (ticketId, percentage, mode, targetColumnId) => {
    try {
      setLoading(true);
      if (percentage) {
        const modeInt = mode || 1;
        let baseCost = 0;
        try {
           const res = await TicketCostService.calculateBaseCost(ticketId, modeInt);
           baseCost = res.base_cost || 0;
        } catch(err) {
           console.error("Error calculating base cost for ticket", ticketId, err);
        }
        
        const calculatedCost = baseCost * (parseFloat(percentage) / 100);

        const linkedItems = await ItemTicketService.getItemsForTicket(ticketId);
        const groupId = Date.now().toString() + Math.random().toString(36).substr(2, 5);

        if (linkedItems && linkedItems.length > 0) {
          const dividedCost = calculatedCost / linkedItems.length;
          for (const item of linkedItems) {
            await TicketCostService.saveCustomReopenCost(
              ticketId, dividedCost, item.items_id, item.itemtype, groupId,
              parseFloat(percentage), modeInt, baseCost
            );
          }
        } else {
          await TicketCostService.saveCustomReopenCost(
            ticketId, calculatedCost, null, null, groupId,
            parseFloat(percentage), modeInt, baseCost
          );
        }
      }
      setReopenModalData(prev => ({ ...prev, isOpen: false }));
      if (targetColumnId === 'inProgress') {
        await TicketService.updateTicket(ticketId, { status: 2 });
        await fetchTickets();
        setAssignModalData({ isOpen: true, ticketId: ticketId, selectedUserId: '' });
      } else {
        await TicketService.updateTicket(ticketId, { status: 1 });
        await fetchTickets();
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = async (e, targetColumnId) => {
    e.preventDefault();
    const ticketId = e.dataTransfer.getData('text/plain');
    const fromColumnId = e.dataTransfer.getData('fromColumn');

    if (!ticketId || fromColumnId === targetColumnId) return;

    if (fromColumnId === 'termine' && targetColumnId === 'inProgress') {
      setReopenModalData({
        isOpen: true,
        ticketId: ticketId,
        targetColumnId: targetColumnId,
        showPercentage: false,
        percentage: '',
        mode: 1
      });
      return;
    }

    if (targetColumnId === 'termine') {
      setCloseModalData({
        isOpen: true,
        ticketId: ticketId,
        comment: '',
        date: new Date().toISOString().split('T')[0],
        superCost: ''
      });
    } else if (targetColumnId === 'inProgress') {
      // Set status to 2 immediately and open the assign modal
      try {
        setLoading(true);
        await TicketService.updateTicket(ticketId, { status: 2 });
        await fetchTickets();
        setAssignModalData({
          isOpen: true,
          ticketId: ticketId,
          selectedUserId: ''
        });
      } catch (err) {
        console.error('Error setting status to In Progress:', err);
      } finally {
        setLoading(false);
      }
    } else {
      // Direct status update (back to Nouveau / 1)
      try {
        setLoading(true);
        await TicketService.updateTicket(ticketId, { status: 1 });
        await fetchTickets();
      } catch (err) {
        console.error('Error updating status:', err);
        alert('Erreur lors de la mise à jour du statut: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleConfirmClose = async (e) => {
    if (e) e.preventDefault();
    const { ticketId, comment, date, superCost } = closeModalData;

    if (!ticketId) return;

    try {
      setLoading(true);
      
      // Fetch ticket to get existing content
      const ticketObj = await TicketService.getTicket(ticketId);
      const currentContent = ticketObj.content || '';
      
      const formattedDate = date ? new Date(date).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR');
      const closingNote = `\n\n[Clôture - Date de réalisation : ${formattedDate}]${comment.trim() ? ` Commentaire : ${comment.trim()}` : ''}`;
      
      const updatedContent = currentContent + closingNote;

      await TicketService.updateTicket(ticketId, {
        status: 6, // Clos/Terminé
        content: updatedContent
      });

      if (superCost !== '') {
        const linkedItems = await ItemTicketService.getItemsForTicket(ticketId);
        const groupId = Date.now().toString();
        const costValue = parseFloat(superCost);

        if (linkedItems && linkedItems.length > 0) {
          const dividedCost = costValue / linkedItems.length;
          for (const item of linkedItems) {
            await TicketCostService.saveSuperCost(ticketId, dividedCost, item.items_id, item.itemtype, groupId);
          }
        } else {
          await TicketCostService.saveSuperCost(ticketId, costValue, null, null, groupId);
        }
      }

      setCloseModalData({
        isOpen: false,
        ticketId: null,
        comment: '',
        date: '',
        superCost: ''
      });

      await fetchTickets();
    } catch (err) {
      console.error('Error closing ticket:', err);
      alert('Erreur lors de la clôture du ticket: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAssignee = async (ticketId, selectedUserId) => {
    if (!ticketId || !selectedUserId) return;
    try {
      setLoading(true);
      await TicketService.assignUserToTicket(ticketId, selectedUserId);
      await fetchTickets();
    } catch (err) {
      console.error('Error assigning technician:', err);
      alert('Erreur lors de l\'attribution du technicien : ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignee = async (relationId) => {
    try {
      setLoading(true);
      await TicketService.removeUserFromTicket(relationId);
      await fetchTickets();
    } catch (err) {
      console.error('Error removing technician:', err);
      alert('Erreur lors du retrait du technicien : ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Group tickets into columns
  const getColumns = () => {
    const columns = {
      nouveau: {
        id: 'nouveau',
        title: kanbanSettings.label_nouveau,
        tickets: [],
        color: kanbanSettings.color_nouveau,
        count: TicketService.countTicketsByStatus(tickets, 1),
      },
      inProgress: {
        id: 'inProgress',
        title: kanbanSettings.label_inProgress,
        tickets: [],
        color: kanbanSettings.color_inProgress,
        count: TicketService.countTicketsByStatus(tickets, 2),
      },
      termine: {
        id: 'termine',
        title: kanbanSettings.label_termine,
        tickets: [],
        color: kanbanSettings.color_termine,
        count: TicketService.countTicketsByStatus(tickets, 6),
      },
    };

    tickets.forEach(ticket => {
      // Map GLPI statuses (1: Nouveau, 2: Assigné, 6: Clos)
      const statusNum = Number(ticket.status);
      if (statusNum === 1) {
        columns.nouveau.tickets.push(ticket);
      } else if (statusNum === 2) {
        columns.inProgress.tickets.push(ticket);
      } else if (statusNum === 6) {
        columns.termine.tickets.push(ticket);
      }
    });

    return columns;
  };

  const hexToRgba = (hex, opacity = 0.08) => {
    if (!hex) return `rgba(241, 245, 249, ${opacity})`;
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const cols = getColumns();

  return (
    <FrontOfficeLayout>
      <div className="frontoffice-page kanban-page">
        <div className="kanban-header">
          <div className="kanban-title-section">
            <Ticket size={24} className="title-icon" />
            <h1>Tableau de suivi (Kanban)</h1>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Link to="/admin" className="cancel-modal-btn" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px', margin: 0 }}>
              <Settings size={16} />
              Configuration
            </Link>
            <Link to="/frontoffice/tickets/add" className="add-ticket-btn">
              + Nouveau Ticket
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="kanban-loading">Chargement du tableau...</div>
        ) : (
          <div className="kanban-board">
            {Object.values(cols).map(col => (
              <div 
                key={col.id} 
                className={`kanban-column col-${col.id}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, col.id)}
                style={{ 
                  backgroundColor: col.color,
                  border: `2px solid ${col.color}`
                }}
              >
                <div className="column-header">
                  <div className="column-title" style={{ color: '#ffffff' }}>
                    <span>{col.title}</span>
                    <span className="column-count" style={{ backgroundColor: 'rgba(255, 255, 255, 0.25)', color: '#ffffff' }}>{col.count}</span>
                  </div>
                  {col.id === 'nouveau' && (
                    <button
                      className="column-add-btn"
                      onClick={openQuickAdd}
                      style={{ backgroundColor: '#ffffff', color: col.color, border: 'none' }}
                    >
                      + Créer des tickets
                    </button>
                  )}
                </div>

                <div className="column-cards-container">
                  {col.tickets.length > 0 ? (
                    col.tickets.map(ticket => {
                      const priority = getPriorityInfo(ticket.priority);
                      const type = getTypeInfo(ticket.type);

                      // Find assigned technicians for this ticket
                      const cardAssignees = ticketUserRelations
                        .filter(rel => Number(rel.tickets_id) === Number(ticket.id) && Number(rel.type) === 2)
                        .map(rel => {
                          const tech = technicians.find(t => Number(t.id) === Number(rel.users_id));
                          return tech ? tech.name : null;
                        })
                        .filter(Boolean);

                      return (
                        <div
                          key={ticket.id}
                          className="kanban-card"
                          onClick={() => navigate(`/frontoffice/tickets/${ticket.id}`)}
                          draggable
                          onDragStart={(e) => {
                            e.stopPropagation();
                            handleDragStart(e, ticket.id, col.id);
                          }}
                        >
                          <div className="card-top">
                            <span className="ticket-id">#{ticket.id}</span>
                            <span
                              className="type-badge"
                              style={{ color: type.color, backgroundColor: type.bg }}
                            >
                              {type.label}
                            </span>
                          </div>
                          <h3 className="card-title">{ticket.name || 'Sans titre'}</h3>
                          <p className="card-desc">
                            {ticket.content
                              ? ticket.content.length > 80
                                ? `${ticket.content.substring(0, 80)}...`
                                : ticket.content
                              : 'Aucune description'}
                          </p>

                          {cardAssignees.length > 0 && (
                            <div className="card-assignees" style={{ margin: '8px 0', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {cardAssignees.map((name, idx) => (
                                <span 
                                  key={idx} 
                                  style={{ 
                                    fontSize: '0.725rem', 
                                    padding: '2px 8px', 
                                    borderRadius: '12px', 
                                    background: '#f1f5f9', 
                                    color: '#475569',
                                    border: '1px solid #e2e8f0',
                                    fontWeight: '500'
                                  }}
                                >
                                  👤 {name}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="card-footer">
                            <span
                              className="priority-badge"
                              style={{ color: priority.color, backgroundColor: priority.bg }}
                            >
                              {priority.label}
                            </span>
                            <div className="card-date">
                              <Calendar size={12} />
                              <span>{ticket.date ? new Date(ticket.date).toLocaleDateString('fr-FR') : '-'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="column-empty">Aucun ticket</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <TicketReopenModal
          isOpen={reopenModalData.isOpen}
          onClose={() => setReopenModalData(prev => ({ ...prev, isOpen: false }))}
          data={reopenModalData}
          setData={setReopenModalData}
          onCancelSuperCost={handleCancelSuperCost}
          onReopenTicket={handleReopenTicket}
        />

        {/* QUICK ADD MODAL */}
        <TicketQuickAddModal
          isOpen={showQuickAdd}
          onClose={() => setShowQuickAdd(false)}
          onSubmit={handleQuickAddSubmit}
          quickTickets={quickTickets}
          quickSubmitting={quickSubmitting}
          itemTypeOptions={itemTypeOptions}
          allItemsByType={allItemsByType}
          users={users}
          handleAddQuickTicket={handleAddQuickTicket}
          handleRemoveQuickTicket={handleRemoveQuickTicket}
          handleQuickTicketChange={handleQuickTicketChange}
          handleAddQuickRow={handleAddQuickRow}
          handleQuickRowChange={handleQuickRowChange}
          handleRemoveQuickRow={handleRemoveQuickRow}
        />

        {/* CLOSE TICKET MODAL */}
        <TicketCloseModal
          isOpen={closeModalData.isOpen}
          onClose={() => setCloseModalData(prev => ({ ...prev, isOpen: false }))}
          onSubmit={handleConfirmClose}
          data={closeModalData}
          setData={setCloseModalData}
        />

        {/* ASSIGN TICKET MODAL */}
        <TicketAssignModal
          isOpen={assignModalData.isOpen}
          onClose={() => setAssignModalData(prev => ({ ...prev, isOpen: false }))}
          ticketId={assignModalData.ticketId}
          tickets={tickets}
          technicians={technicians}
          relations={ticketUserRelations}
          onAddAssignee={handleAddAssignee}
          onRemoveAssignee={handleRemoveAssignee}
        />
      </div>
    </FrontOfficeLayout>
  );
};

// Sub-component: Quick Add Modal (multiple forms)
const TicketQuickAddModal = ({
  isOpen,
  onClose,
  onSubmit,
  quickTickets,
  quickSubmitting,
  itemTypeOptions,
  allItemsByType,
  users = [],
  handleAddQuickTicket,
  handleRemoveQuickTicket,
  handleQuickTicketChange,
  handleAddQuickRow,
  handleQuickRowChange,
  handleRemoveQuickRow
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container modal-container-large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Création multiple de tickets</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="modal-body modal-body-scrollable">
            {quickTickets.map((ticket, index) => (
              <div key={ticket.tempId} className="quick-ticket-card">
                <div className="quick-ticket-header">
                  <h3 className="quick-ticket-title">
                    <span className="quick-ticket-badge">
                      {index + 1}
                    </span>
                    Ticket
                  </h3>
                  {quickTickets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuickTicket(ticket.tempId)}
                      className="remove-ticket-form-btn"
                    >
                      <Trash2 size={14} />
                      Supprimer
                    </button>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor={`quickTitle-${ticket.tempId}`}>Titre *</label>
                  <input
                    type="text"
                    id={`quickTitle-${ticket.tempId}`}
                    value={ticket.name}
                    onChange={e => handleQuickTicketChange(ticket.tempId, 'name', e.target.value)}
                    placeholder="Ex: Problème d'impression..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor={`quickDesc-${ticket.tempId}`}>Description *</label>
                  <textarea
                    id={`quickDesc-${ticket.tempId}`}
                    rows="3"
                    value={ticket.content}
                    onChange={e => handleQuickTicketChange(ticket.tempId, 'content', e.target.value)}
                    placeholder="Décrivez votre problème en détail..."
                    required
                  ></textarea>
                </div>

                <div className="form-group">
                  <label htmlFor={`quickRecipient-${ticket.tempId}`}>Demandeur *</label>
                  <select
                    id={`quickRecipient-${ticket.tempId}`}
                    value={ticket.users_id_recipient || ''}
                    onChange={e => handleQuickTicketChange(ticket.tempId, 'users_id_recipient', e.target.value)}
                    required
                  >
                    <option value="">-- Sélectionner le demandeur --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.realname || u.firstname ? `${u.realname || ''} ${u.firstname || ''}`.trim() : u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row quick-ticket-form-row">
                  <div className="form-group">
                    <label htmlFor={`quickType-${ticket.tempId}`}>Type</label>
                    <select
                      id={`quickType-${ticket.tempId}`}
                      value={ticket.type}
                      onChange={e => handleQuickTicketChange(ticket.tempId, 'type', Number(e.target.value))}
                    >
                      <option value={1}>Incident</option>
                      <option value={2}>Demande</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor={`quickPriority-${ticket.tempId}`}>Priorité</label>
                    <select
                      id={`quickPriority-${ticket.tempId}`}
                      value={ticket.priority}
                      onChange={e => handleQuickTicketChange(ticket.tempId, 'priority', Number(e.target.value))}
                    >
                      <option value={1}>Très basse</option>
                      <option value={2}>Basse</option>
                      <option value={3}>Moyenne</option>
                      <option value={4}>Haute</option>
                      <option value={5}>Très haute</option>
                      <option value={6}>Majeure</option>
                    </select>
                  </div>
                </div>

                {/* EQUIPMENT ASSOCIATION */}
                <div className="quick-equipments-section">
                  <div className="quick-equipments-header">
                    <h4 className="quick-equipments-title">
                      Équipements associés (optionnel)
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleAddQuickRow(ticket.tempId)}
                      className="add-equipment-btn"
                    >
                      <Plus size={12} />
                      Ajouter un équipement
                    </button>
                  </div>

                  {ticket.itemRows.length > 0 ? (
                    <div className="quick-equipment-rows-list">
                      {ticket.itemRows.map((row) => (
                        <div key={row.tempId} className="quick-equipment-row">
                          <div className="form-group">
                            <label>Type</label>
                            <select
                              value={row.itemType}
                              onChange={(e) => handleQuickRowChange(ticket.tempId, row.tempId, 'itemType', e.target.value)}
                            >
                              <option value="">Sélectionner un type...</option>
                              {itemTypeOptions.map(opt => (
                                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                            </select>
                          </div>

                          <div className="form-group">
                            <label>Élément</label>
                            <select
                              value={row.itemId}
                              onChange={(e) => handleQuickRowChange(ticket.tempId, row.tempId, 'itemId', e.target.value)}
                              disabled={!row.itemType}
                            >
                              <option value="">Sélectionner un élément...</option>
                              {(allItemsByType[row.itemType] || []).map(item => (
                                <option key={item.id} value={item.id}>{item.name || `ID: ${item.id}`}</option>
                              ))}
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveQuickRow(ticket.tempId, row.tempId)}
                            className="remove-equipment-btn"
                          >
                            Supprimer
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="quick-equipments-empty">
                      Aucun équipement associé. Cliquez sur "+ Ajouter un équipement" pour commencer.
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div className="add-more-container">
              <button
                type="button"
                onClick={handleAddQuickTicket}
                className="add-more-ticket-form-btn"
              >
                <Plus size={16} />
                Ajouter un autre formulaire de ticket
              </button>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="cancel-modal-btn"
              onClick={onClose}
            >
              Annuler
            </button>
            <button type="submit" className="edit-nav-btn" disabled={quickSubmitting}>
              {quickSubmitting ? 'Création...' : `Créer ${quickTickets.length} ticket(s)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Sub-component: Close Dialog Modal
const TicketCloseModal = ({ isOpen, onClose, onSubmit, data, setData }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
        <div className="modal-header">
          <h2>Clôture du ticket #{data.ticketId}</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="closeDate">Date de réalisation *</label>
              <input
                type="date"
                id="closeDate"
                value={data.date}
                onChange={e => setData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="superCost">Super Coût (optionnel)</label>
              <input
                type="number"
                step="0.01"
                id="superCost"
                value={data.superCost || ''}
                onChange={e => setData(prev => ({ ...prev, superCost: e.target.value }))}
                placeholder="Ex: 150.50"
              />
            </div>

            <div className="form-group">
              <label htmlFor="closeComment">Commentaire de clôture</label>
              <textarea
                id="closeComment"
                rows="4"
                value={data.comment}
                onChange={e => setData(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Indiquez les détails de la résolution ou remarques de clôture..."
              ></textarea>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="cancel-modal-btn"
              onClick={onClose}
            >
              Annuler
            </button>
            <button type="submit" className="edit-nav-btn">
              Confirmer la clôture
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Sub-component: Assign Ticket Modal (Supports multiple technicians)
const TicketAssignModal = ({ 
  isOpen, 
  onClose, 
  ticketId, 
  tickets = [], 
  technicians = [], 
  relations = [], 
  onAddAssignee, 
  onRemoveAssignee
}) => {
  const [selectedTechId, setSelectedTechId] = React.useState('');

  if (!isOpen) return null;

  // Find the ticket
  const ticket = tickets.find(t => Number(t.id) === Number(ticketId));
  const ticketTitle = ticket ? ticket.name : '';

  // Filter relations to get assignees (type === 2) for this ticket
  const currentAssignees = relations.filter(
    rel => Number(rel.tickets_id) === Number(ticketId) && Number(rel.type) === 2
  );

  // Map technician objects that are currently assigned
  const assignedTechIds = currentAssignees.map(rel => Number(rel.users_id));

  // Technicians that are NOT already assigned to this ticket
  const availableTechs = technicians.filter(
    tech => !assignedTechIds.includes(Number(tech.id))
  );

  const handleAddClick = (e) => {
    e.preventDefault();
    if (!selectedTechId) return;
    onAddAssignee(ticketId, selectedTechId);
    setSelectedTechId('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2>Attribution du ticket #{ticketId}</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '24px' }}>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: '#0f172a' }}>
            {ticketTitle || 'Sans titre'}
          </h4>
          <p style={{ margin: '0 0 20px 0', color: '#64748b', fontSize: '0.875rem' }}>
            Gérez la liste des techniciens attribués à ce ticket.
          </p>

          {/* List of current assignees */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#334155', fontSize: '0.875rem' }}>
              Techniciens attribués ({currentAssignees.length})
            </label>
            {currentAssignees.length === 0 ? (
              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #e2e8f0', color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center' }}>
                Aucun technicien attribué
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {currentAssignees.map(rel => {
                  const techObj = technicians.find(t => Number(t.id) === Number(rel.users_id));
                  return (
                    <div 
                      key={rel.id} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '10px 14px', 
                        background: '#f1f5f9', 
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <span style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: '500' }}>
                        {techObj ? techObj.name : `Utilisateur #${rel.users_id}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveAssignee(rel.id)}
                        style={{ 
                          background: '#fee2e2', 
                          border: 'none', 
                          color: '#ef4444', 
                          padding: '6px', 
                          borderRadius: '6px', 
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'background 0.2s'
                        }}
                        title="Retirer ce technicien"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add assignee section */}
          <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#334155', fontSize: '0.875rem' }}>
              Ajouter un technicien
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                value={selectedTechId}
                onChange={e => setSelectedTechId(e.target.value)}
                style={{ 
                  flex: 1, 
                  padding: '10px', 
                  borderRadius: '8px', 
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
                onClick={handleAddClick}
                disabled={!selectedTechId}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: selectedTechId ? '#3b82f6' : '#93c5fd',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: selectedTechId ? 'pointer' : 'not-allowed',
                  fontSize: '0.9rem'
                }}
              >
                <Plus size={16} />
                Ajouter
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid #f1f5f9', padding: '16px 24px' }}>
          <button
            type="button"
            className="cancel-modal-btn"
            onClick={onClose}
            style={{ margin: 0 }}
          >
            Fermer
          </button>
        </div>
    </div>
    </div>
  );
};

const TicketReopenModal = ({ isOpen, onClose, data, setData, onCancelSuperCost, onReopenTicket }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
        <div className="modal-header">
          <h2>Réouverture du ticket #{data.ticketId}</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body">
          <p style={{ marginBottom: '20px', color: '#64748b' }}>
            Choisissez l'action à effectuer pour la réouverture de ce ticket.
          </p>
          
          <div style={{ display: 'flex', gap: '12px', marginBottom: data.showPercentage ? '20px' : '0' }}>
            <button 
              type="button" 
              className="cancel-modal-btn" 
              style={{ flex: 1, backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', margin: 0 }}
              onClick={() => onCancelSuperCost(data.ticketId, data.targetColumnId)}
            >
              Annulation
            </button>
            <button 
              type="button" 
              className="edit-nav-btn" 
              style={{ flex: 1, margin: 0 }}
              onClick={() => setData(prev => ({ ...prev, showPercentage: true }))}
            >
              Réouverture
            </button>
          </div>

          {data.showPercentage && (
            <div className="form-group" style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#334155' }}>Mode de calcul</label>
              <select
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '12px' }}
                value={data.mode || 1}
                onChange={e => setData(prev => ({ ...prev, mode: parseInt(e.target.value, 10) }))}
              >
                <option value={1}>1 - Calcul par le dernier super coût</option>
                <option value={2}>2 - Calcul par le premier super coût</option>
                <option value={3}>3 - Moyenne de tous les super coûts</option>
                <option value={4}>4 - Somme des super coûts</option>
              </select>

              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#334155' }}>Pourcentage du coût (%)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  value={data.percentage || ''}
                  onChange={e => setData(prev => ({ ...prev, percentage: e.target.value }))}
                  placeholder="Ex: 50"
                  min="0"
                />
                <button 
                  type="button" 
                  className="edit-nav-btn"
                  style={{ backgroundColor: '#10b981', margin: 0 }}
                  onClick={() => onReopenTicket(data.ticketId, data.percentage, data.mode, data.targetColumnId)}
                >
                  Valider
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketKanban;
