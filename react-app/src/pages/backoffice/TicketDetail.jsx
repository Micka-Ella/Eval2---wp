import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, User, Layers, ArrowUpRight, DollarSign } from 'lucide-react';
import TicketService from '../../services/Ticket/TicketService';
import ItemTicketService from '../../services/ItemTicket/ItemTicketService';
import TicketCostService from '../../services/TicketCost/TicketCostService';
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
import DatabaseInstanceService from '../../services/DatabaseInstance/DatabaseInstanceService';
import DCRoomService from '../../services/DCRoom/DCRoomService';
import StateService from '../../services/State/StateService';
import LocationService from '../../services/Location/LocationService';
import ManufacturerService from '../../services/Manufacturer/ManufacturerService';
import ComputerModelService from '../../services/ComputerModel/ComputerModelService';
import ComputerTypeService from '../../services/ComputerType/ComputerTypeService';
import '../../styles/detail.css';

const TicketDetail = () => {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [linkedItems, setLinkedItems] = useState([]);
  const [ticketCosts, setTicketCosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const priorityOptions = [
    { value: 1, label: 'Très basse', color: '#9e9e9e' },
    { value: 2, label: 'Basse', color: '#4caf50' },
    { value: 3, label: 'Moyenne', color: '#ff9800' },
    { value: 4, label: 'Haute', color: '#f44336' },
    { value: 5, label: 'Très haute', color: '#9c27b0' },
    { value: 6, label: 'Majeure', color: '#b71c1c' },
  ];

  const typeOptions = [
    { value: 1, label: 'Incident' },
    { value: 2, label: 'Demande' },
  ];

  const getPriorityInfo = (priorityId) => {
    const option = priorityOptions.find(opt => opt.value === priorityId);
    return option || { label: 'Priorité inconnue', color: '#9e9e9e' };
  };

  const getTypeName = (typeId) => {
    const option = typeOptions.find(opt => opt.value === typeId);
    return option ? option.label : 'Type inconnu';
  };

  // Function to get the correct link path for an item type
  const getItemLink = (itemType, itemId) => {
    const typeMap = {
      'Computer': '/parc/computers',
      'Monitor': '/parc/monitors',
      'Software': '/parc/software',
      'Printer': '/parc/printers',
      'PDU': '/parc/pdus',
      'Rack': '/parc/racks',
      'Phone': '/parc/phones',
      'Chassis': '/parc/chassis',
      'Enclosure': '/parc/chassis',
      'NetworkEquipment': '/parc/network-equipment',
      'SoftwareLicense': '/parc/licenses',
      'Peripheral': '/parc/peripherals',
      'DatabaseInstance': '/parc/database-instances',
      'DCRoom': '/parc/dc-rooms'
    };
    const basePath = typeMap[itemType];
    if (basePath) {
      return `${basePath}/${itemId}`;
    }
    return null;
  };

  // Function to get a user-friendly label for item type
  const getItemTypeLabel = (itemType) => {
    const labelMap = {
      'Computer': 'Ordinateur',
      'Monitor': 'Moniteur',
      'Software': 'Logiciel',
      'Printer': 'Imprimante',
      'PDU': 'PDU',
      'Rack': 'Baie',
      'Phone': 'Téléphone',
      'Chassis': 'Châssis',
      'Enclosure': 'Châssis',
      'NetworkEquipment': 'Matériel réseau',
      'SoftwareLicense': 'Licence logiciel',
      'Peripheral': 'Périphérique',
      'DatabaseInstance': 'Base de données',
      'DCRoom': 'Salle serveur'
    };
    return labelMap[itemType] || itemType;
  };

  // Function to fetch a full item by its type and id
  const fetchFullItem = async (itemType, itemId) => {
    try {
      switch (itemType) {
        case 'Computer':
          return await ComputerService.getComputerById(itemId);
        case 'Monitor':
          return await MonitorService.getMonitorById(itemId);
        case 'Software':
          return await SoftwareService.getSoftwareById(itemId);
        case 'Printer':
          return await PrinterService.getPrinterById(itemId);
        case 'PDU':
          return await PDUService.getPDUById(itemId);
        case 'Rack':
          return await RackService.getRackById(itemId);
        case 'Phone':
          return await PhoneService.getPhoneById(itemId);
        case 'Chassis':
          return await ChassisService.getChassisById(itemId);
        case 'NetworkEquipment':
          return await NetworkEquipmentService.getNetworkEquipmentById(itemId);
        case 'SoftwareLicense':
          return await SoftwareLicenseService.getSoftwareLicenseById(itemId);
        case 'Peripheral':
          return await PeripheralService.getPeripheralById(itemId);
        case 'DatabaseInstance':
          return await DatabaseInstanceService.getDatabaseInstanceById(itemId);
        case 'DCRoom':
          return await DCRoomService.getDCRoomById(itemId);
        default:
          return null;
      }
    } catch (error) {
      console.error(`Error fetching ${itemType} with id ${itemId}:`, error);
      return null;
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const [ticketData, itemsData, statesData, locationsData, manufacturersData, computerModelsData, computerTypesData, costsData] = await Promise.all([
          TicketService.getTicket(id),
          ItemTicketService.getItemsForTicket(id),
          StateService.getAllStates(),
          LocationService.getAllLocations(),
          ManufacturerService.getAllManufacturers(),
          ComputerModelService.getAllComputerModels(),
          ComputerTypeService.getAllComputerTypes(),
          TicketCostService.getTicketCosts(id)
        ]);
        
        console.log('Ticket data:', ticketData);
        console.log('Linked items:', itemsData);
        
        // Create maps for related data
        const statesMap = {};
        statesData.forEach(state => statesMap[state.id] = state.name);
        
        const locationsMap = {};
        locationsData.forEach(loc => locationsMap[loc.id] = loc.name);
        
        const manufacturersMap = {};
        manufacturersData.forEach(mf => manufacturersMap[mf.id] = mf.name);
        
        const computerModelsMap = {};
        computerModelsData.forEach(model => computerModelsMap[model.id] = model.name);
        
        const computerTypesMap = {};
        computerTypesData.forEach(type => computerTypesMap[type.id] = type.name);
        
        // Fetch full details for each linked item
        const itemsWithDetails = await Promise.all(
          itemsData.map(async (linkedItem) => {
            const fullItem = await fetchFullItem(linkedItem.itemtype, linkedItem.items_id);
            return {
              ...linkedItem,
              fullItem: fullItem
            };
          })
        );
        
        console.log('Items with full details:', itemsWithDetails);
        
        setTicket(ticketData);
        setTicketCosts(Array.isArray(costsData) ? costsData : []);
        setLinkedItems({
          items: itemsWithDetails,
          statesMap,
          locationsMap,
          manufacturersMap,
          computerModelsMap,
          computerTypesMap
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAllData();
    }
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="ticket-detail-page">
        <div className="loading-state">Chargement du ticket...</div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="ticket-detail-page">
        <div className="empty-state">Ticket introuvable</div>
      </div>
    );
  }

  const priorityInfo = getPriorityInfo(ticket.priority);

  return (
    <div className="ticket-detail-page">
      <div className="detail-header">
        <Link to="/tickets" className="back-btn">
          <ArrowLeft size={16} />
          Retour à la liste
        </Link>
        <h1>Ticket #{ticket.id} - {ticket.name || 'Sans titre'}</h1>
      </div>

      <div className="detail-content">
        <div className="detail-card">
          <h2>Informations générales</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <div className="detail-label">ID</div>
              <div className="detail-value">{ticket.id}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Titre</div>
              <div className="detail-value">{ticket.name || 'Non défini'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Type</div>
              <div className="detail-value">{getTypeName(ticket.type)}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Statut</div>
              <div className="detail-value">
                <span className="status-badge">
                  {ticket.status === 1 ? 'Nouveau' :
                   ticket.status === 2 ? 'En cours (Attribué)' :
                   ticket.status === 3 ? 'En cours (Planifié)' :
                   ticket.status === 4 ? 'En attente' :
                   ticket.status === 5 ? 'Résolu' :
                   ticket.status === 6 ? 'Clos' : 'Statut inconnu'}
                </span>
              </div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Priorité</div>
              <div className="detail-value">
                <span 
                  className="priority-badge"
                  style={{ backgroundColor: priorityInfo.color + '20', color: priorityInfo.color, borderColor: priorityInfo.color }}
                >
                  {priorityInfo.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="detail-card">
          <h2>Dates</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <div className="detail-label">
                <Calendar size={16} />
                Date d'ouverture
              </div>
              <div className="detail-value">{formatDate(ticket.date)}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">
                <Clock size={16} />
                Dernière modification
              </div>
              <div className="detail-value">{formatDate(ticket.date_mod)}</div>
            </div>
          </div>
        </div>

        <div className="detail-card">
          <h2>Description</h2>
          <div className="detail-description">
            {ticket.content || 'Aucune description fournie.'}
          </div>
        </div>

        <div className="detail-card">
          <h2>
            <Layers size={18} style={{ marginRight: '8px' }} />
            Éléments liés
          </h2>
          {linkedItems.items && linkedItems.items.length > 0 ? (
            <div className="linked-items-table-container">
              <table className="linked-items-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Nom</th>
                    <th>Modèle</th>
                    <th>Numéro de série</th>
                    <th>Numéro d'inventaire</th>
                    <th>Statut</th>
                    <th>Lieu</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {linkedItems.items.map((linkedItem) => {
                    const itemLink = getItemLink(linkedItem.itemtype, linkedItem.items_id);
                    const item = linkedItem.fullItem || linkedItem.item || {};
                    const { statesMap, locationsMap, computerModelsMap } = linkedItems;
                    
                    // Get model name based on item type
                    let modelName = '-';
                    if (item.computermodels_id) {
                      modelName = computerModelsMap[item.computermodels_id] || '-';
                    } else if (item.computermodels_name) {
                      modelName = item.computermodels_name;
                    } else if (item.monitormodels_name) {
                      modelName = item.monitormodels_name;
                    } else if (item.printermodels_name) {
                      modelName = item.printermodels_name;
                    }
                    
                    return (
                      <tr key={linkedItem.id}>
                        <td>{getItemTypeLabel(linkedItem.itemtype)}</td>
                        <td className="item-name-cell">
                          {item.name || item.name || `ID: ${linkedItem.items_id}`}
                        </td>
                        <td>{modelName}</td>
                        <td>{item.serial || '-'}</td>
                        <td>{item.otherserial || '-'}</td>
                        <td>
                          {item.states_name || 
                           (item.state && item.state.name) || 
                           (item.states_id && statesMap[item.states_id]) || 
                           '-'}
                        </td>
                        <td>
                          {item.locations_name || 
                           (item.location && item.location.name) || 
                           (item.locations_id && locationsMap[item.locations_id]) || 
                           '-'}
                        </td>
                        <td className="item-actions-cell">
                          {itemLink && (
                            <Link 
                              to={itemLink} 
                              className="view-item-link"
                              title="Voir les détails de l'élément"
                            >
                              <ArrowUpRight size={14} />
                              Voir détails
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              Aucun élément lié à ce ticket.
            </div>
          )}
        </div>

        <div className="detail-card">
          <h2>
            <DollarSign size={18} style={{ marginRight: '8px' }} />
            Coûts associés
          </h2>
          {ticketCosts.length > 0 ? (
            <>
              <div className="linked-items-table-container">
                <table className="linked-items-table">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Date de début</th>
                      <th>Date de fin</th>
                      <th>Budget</th>
                      <th>Durée</th>
                      <th>Coût horaire (€)</th>
                      <th>Coût fixe (€)</th>
                      <th>Coût matériel (€)</th>
                      <th>Coût total (€)</th>
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
                      
                      // Formater la durée (secondes -> format lisible)
                      const formatDuration = (seconds) => {
                        const secs = parseInt(seconds) || 0;
                        if (secs === 0) return '0 seconde';
                        
                        const h = Math.floor(secs / 3600);
                        const m = Math.floor((secs % 3600) / 60);
                        const s = secs % 60;
                        
                        let result = [];
                        if (h > 0) result.push(`${h} heure${h > 1 ? 's' : ''}`);
                        if (m > 0) result.push(`${m} minute${m > 1 ? 's' : ''}`);
                        if (s > 0) result.push(`${s} seconde${s > 1 ? 's' : ''}`);
                        
                        return result.join(' ');
                      };

                      // Formater la date
                      const formatDate = (dateStr) => {
                        if (!dateStr) return '';
                        const date = new Date(dateStr);
                        return date.toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                      };

                      return (
                        <tr key={cost.id}>
                          <td>{cost.name || 'Sans description'}</td>
                          <td>{formatDate(cost.begin_date)}</td>
                          <td>{formatDate(cost.end_date)}</td>
                          <td>{cost.budget ? parseFloat(cost.budget).toFixed(2) + ' €' : '-'}</td>
                          <td>{formatDuration(cost.actiontime)}</td>
                          <td>{hourlyRate.toFixed(2)}</td>
                          <td>{costFixed.toFixed(2)}</td>
                          <td>{costMaterial.toFixed(2)}</td>
                          <td style={{ fontWeight: 'bold' }}>{total.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="cost-total-row">
                      <td colSpan={4}></td>
                      <td>
                        {(() => {
                          const totalSecs = ticketCosts.reduce((sum, c) => sum + (parseInt(c.actiontime) || 0), 0);
                          if (totalSecs === 0) return '0 seconde';
                          const h = Math.floor(totalSecs / 3600);
                          const m = Math.floor((totalSecs % 3600) / 60);
                          const s = totalSecs % 60;
                          const parts = [];
                          if (h > 0) parts.push(`${h} heure${h > 1 ? 's' : ''}`);
                          if (m > 0) parts.push(`${m} minute${m > 1 ? 's' : ''}`);
                          if (s > 0) parts.push(`${s} seconde${s > 1 ? 's' : ''}`);
                          return parts.join(' ');
                        })()}
                      </td>
                      <td>
                        {ticketCosts.reduce((sum, c) => {
                          const rate = parseFloat(c.cost_time || 0);
                          const h = (parseInt(c.actiontime) || 0) / 3600;
                          return sum + h * rate;
                        }, 0).toFixed(2)}
                      </td>
                      <td>
                        {ticketCosts.reduce((sum, c) => sum + parseFloat(c.cost_fixed || 0), 0).toFixed(2)}
                      </td>
                      <td>
                        {ticketCosts.reduce((sum, c) => sum + parseFloat(c.cost_material || 0), 0).toFixed(2)}
                      </td>
                      <td>
                        {ticketCosts.reduce((sum, c) => {
                          const rate = parseFloat(c.cost_time || 0);
                          const h = (parseInt(c.actiontime) || 0) / 3600;
                          return sum + h * rate + parseFloat(c.cost_fixed || 0) + parseFloat(c.cost_material || 0);
                        }, 0).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          ) : (
            <div className="empty-state">
              Aucun coût associé à ce ticket.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
