import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Calendar, Clock, User, Link as LinkIcon, DollarSign } from 'lucide-react';
import TicketService from '../../services/Ticket/TicketService';
import ItemTicketService from '../../services/ItemTicket/ItemTicketService';
import UserService from '../../services/User/UserService';
import TicketCostService from '../../services/TicketCost/TicketCostService';
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
import DatabaseInstanceService from '../../services/DatabaseInstance/DatabaseInstanceService';
import DCRoomService from '../../services/DCRoom/DCRoomService';
import { getTicketItemTypes } from '../../config/itemTypes';
import ManufacturerService from '../../services/Manufacturer/ManufacturerService';
import LocationService from '../../services/Location/LocationService';
import StateService from '../../services/State/StateService';
import ComputerModelService from '../../services/ComputerModel/ComputerModelService';
import '../../styles/FrontOffice.css';
import '../../styles/front/TicketKanban.css';

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [linkedItems, setLinkedItems] = useState([]);
  const [loadingLinkedItems, setLoadingLinkedItems] = useState(false);
  const [ticketCosts, setTicketCosts] = useState([]);
  const [loadingCosts, setLoadingCosts] = useState(false);
  const [userMap, setUserMap] = useState({});
  const [requesterId, setRequesterId] = useState(null);
  const [relatedData, setRelatedData] = useState({
    manufacturers: {},
    locations: {},
    states: {},
    computerModels: {}
  });

  const itemTypeOptions = getTicketItemTypes().map(type => ({
    value: type.itemType,
    label: type.label
  }));

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
    { value: 2, label: 'En cours (Attribué)', color: '#2196f3', bg: '#e3f2fd' },
    { value: 3, label: 'En cours (Planifié)', color: '#673ab7', bg: '#f3e5f5' },
    { value: 4, label: 'En attente', color: '#ffc107', bg: '#fffde7' },
    { value: 5, label: 'Résolu', color: '#4caf50', bg: '#e8f5e9' },
    { value: 6, label: 'Clos', color: '#9e9e9e', bg: '#f5f5f5' },
  ];

  const typeOptions = [
    { value: 1, label: 'Incident', color: '#f44336', bg: '#ffebee' },
    { value: 2, label: 'Demande', color: '#2196f3', bg: '#e3f2fd' },
  ];

  const getStatusInfo = (statusId) => {
    const option = statusOptions.find(opt => opt.value === Number(statusId));
    return option || { label: 'Inconnu', color: '#9e9e9e', bg: '#f5f5f5' };
  };

  const getPriorityInfo = (priorityId) => {
    const option = priorityOptions.find(opt => opt.value === Number(priorityId));
    return option || { label: 'Inconnu', color: '#9e9e9e', bg: '#f5f5f5' };
  };

  const getTypeInfo = (typeId) => {
    const option = typeOptions.find(opt => opt.value === Number(typeId));
    return option || { label: 'Inconnu', color: '#9e9e9e', bg: '#f5f5f5' };
  };

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
        case 'Pdu':
        case 'PDU':
          return await PDUService.getPDUById(itemId);
        case 'Rack':
          return await RackService.getRackById(itemId);
        case 'Phone':
          return await PhoneService.getPhoneById(itemId);
        case 'Chassis':
        case 'Enclosure':
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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await UserService.getAllUsers();
        const map = {};
        users.forEach(u => {
          map[u.id] = u.name;
        });
        setUserMap(map);
      } catch (e) {
        console.error('Error fetching users:', e);
      }
    };

    const fetchTicketDetails = async () => {
      setLoading(true);
      try {
        const [
          ticketData,
          itemsData,
          statesData,
          locationsData,
          manufacturersData,
          computerModelsData,
          costsData,
          relationsData
        ] = await Promise.all([
          TicketService.getTicket(id),
          ItemTicketService.getItemsForTicket(id),
          StateService.getAllStates().catch(() => []),
          LocationService.getAllLocations().catch(() => []),
          ManufacturerService.getAllManufacturers().catch(() => []),
          ComputerModelService.getAllComputerModels().catch(() => []),
          TicketCostService.getTicketCosts(id).catch(() => []),
          TicketService.getTicketUsers().catch(() => [])
        ]);

        setTicket(ticketData);
        setTicketCosts(Array.isArray(costsData) ? costsData : []);

        const rels = Array.isArray(relationsData) ? relationsData : [];
        const reqLink = rels.find(rel => Number(rel.tickets_id) === Number(id) && Number(rel.type) === 1);
        if (reqLink) {
          setRequesterId(reqLink.users_id);
        } else {
          setRequesterId(null);
        }

        // Build mapping lookup tables
        const manufacturersMap = {};
        (manufacturersData || []).forEach(m => manufacturersMap[m.id] = m.name);

        const locationsMap = {};
        (locationsData || []).forEach(l => locationsMap[l.id] = l.name);

        const statesMap = {};
        (statesData || []).forEach(s => statesMap[s.id] = s.name);

        const computerModelsMap = {};
        (computerModelsData || []).forEach(cm => computerModelsMap[cm.id] = cm.name);

        setRelatedData({
          manufacturers: manufacturersMap,
          locations: locationsMap,
          states: statesMap,
          computerModels: computerModelsMap
        });

        setLoadingLinkedItems(true);
        // Fetch full details for each linked item
        const itemsWithDetails = await Promise.all(
          (itemsData || []).map(async (linkedItem) => {
            const fullItem = await fetchFullItem(linkedItem.itemtype, linkedItem.items_id);
            return {
              ...linkedItem,
              fullItem: fullItem
            };
          })
        );
        
        const mappedItems = itemsWithDetails.map(item => {
          const typeLabel = itemTypeOptions.find(
            t => t.value.toLowerCase() === item.itemtype.toLowerCase()
          )?.label || item.itemtype;

          const rawItem = item.fullItem || item.item || {};

          // Model
          let modelName = '-';
          if (rawItem.computermodels_id) {
            modelName = computerModelsMap[rawItem.computermodels_id] || '-';
          } else if (rawItem.computermodels_name) {
            modelName = rawItem.computermodels_name;
          } else if (rawItem.monitormodels_name) {
            modelName = rawItem.monitormodels_name;
          } else if (rawItem.printermodels_name) {
            modelName = rawItem.printermodels_name;
          }

          // Manufacturer
          let manufacturerName = '-';
          if (rawItem.manufacturers_id) {
            manufacturerName = manufacturersMap[rawItem.manufacturers_id] || '-';
          } else if (rawItem.manufacturers_name) {
            manufacturerName = rawItem.manufacturers_name;
          }

          // Location
          let locationName = '-';
          if (rawItem.locations_id) {
            locationName = locationsMap[rawItem.locations_id] || '-';
          } else if (rawItem.locations_name) {
            locationName = rawItem.locations_name;
          } else if (rawItem.location && rawItem.location.name) {
            locationName = rawItem.location.name;
          }

          // State (Statut)
          let stateName = '-';
          if (rawItem.states_id) {
            stateName = statesMap[rawItem.states_id] || '-';
          } else if (rawItem.states_name) {
            stateName = rawItem.states_name;
          } else if (rawItem.state && rawItem.state.name) {
            stateName = rawItem.state.name;
          }
          
          return {
            id: item.items_id,
            itemType: item.itemtype,
            name: rawItem.name || `ID: ${item.items_id}`,
            typeLabel: typeLabel,
            manufacturer: manufacturerName,
            model: modelName,
            serial: rawItem.serial || '-',
            location: locationName,
            status: stateName,
            linkId: item.id,
          };
        });
        
        setLinkedItems(mappedItems);
      } catch (error) {
        console.error('Error fetching ticket details:', error);
      } finally {
        setLoading(false);
        setLoadingLinkedItems(false);
      }
    };

    fetchUsers();
    if (id) {
      fetchTicketDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <FrontOfficeLayout>
        <div className="frontoffice-page">
          <div className="loading-state">Chargement des détails du ticket...</div>
        </div>
      </FrontOfficeLayout>
    );
  }

  if (!ticket) {
    return (
      <FrontOfficeLayout>
        <div className="frontoffice-page">
          <div className="empty-state">Ticket introuvable.</div>
        </div>
      </FrontOfficeLayout>
    );
  }

  const priorityInfo = getPriorityInfo(ticket.priority);
  const statusInfo = getStatusInfo(ticket.status);
  const typeInfo = getTypeInfo(ticket.type);

  return (
    <FrontOfficeLayout>
      <div className="frontoffice-page ticket-detail-page">
        <div className="form-header">
          <button onClick={() => navigate(-1)} className="back-btn-form">
            <ArrowLeft size={18} />
            Retour
          </button>
          <h1>Détails du ticket #{ticket.id}</h1>
        </div>

        <div className="ticket-detail-container">
          <div className="ticket-detail-main">
            <div className="ticket-detail-section ticket-main-info">
              <h2>{ticket.name || 'Sans titre'}</h2>
              <div className="metadata-row">
                <span
                  className="meta-tag type"
                  style={{ color: typeInfo.color, backgroundColor: typeInfo.bg }}
                >
                  {typeInfo.label}
                </span>
                <span
                  className="meta-tag status"
                  style={{ color: statusInfo.color, backgroundColor: statusInfo.bg }}
                >
                  {statusInfo.label}
                </span>
                <span
                  className="meta-tag priority"
                  style={{ color: priorityInfo.color, backgroundColor: priorityInfo.bg }}
                >
                  Priorité: {priorityInfo.label}
                </span>
              </div>
            </div>

            <div className="ticket-detail-section description-section">
              <h3>Description</h3>
              <div className="description-box">
                {ticket.content || 'Aucune description fournie.'}
              </div>
            </div>

            <div className="ticket-detail-section info-grid">
              <div className="info-cell">
                <Calendar size={16} />
                <div>
                  <strong>Date de création</strong>
                  <span>{formatDate(ticket.date)}</span>
                </div>
              </div>
              <div className="info-cell">
                <Clock size={16} />
                <div>
                  <strong>Dernière modification</strong>
                  <span>{formatDate(ticket.date_mod)}</span>
                </div>
              </div>
              <div className="info-cell">
                <User size={16} />
                <div>
                  <strong>Demandeur</strong>
                  <span>{userMap[requesterId] || userMap[ticket.users_id_recipient] || (requesterId || ticket.users_id_recipient ? `Utilisateur ID: ${requesterId || ticket.users_id_recipient}` : 'Inconnu')}</span>
                </div>
              </div>
            </div>

            <div className="ticket-detail-section assets-section">
              <h3>Éléments associés</h3>
              {loadingLinkedItems ? (
                <div className="loading-small">Chargement des éléments...</div>
              ) : linkedItems.length > 0 ? (
                <div className="linked-items-table-container">
                  <table className="linked-items-table">
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
                      {linkedItems.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.typeLabel}</td>
                          <td className="item-name-cell">{item.name}</td>
                          <td>{item.manufacturer}</td>
                          <td>{item.model}</td>
                          <td>{item.serial}</td>
                          <td>{item.location}</td>
                          <td>{item.status}</td>
                          <td>
                            {/* Actions column remains empty or custom action buttons can be placed here */}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="no-assets">Aucun équipement lié à ce ticket.</div>
              )}
            </div>

            <div className="ticket-detail-section costs-section" style={{ marginTop: '24px' }}>
              <h3>
                <DollarSign size={18} style={{ marginRight: '8px', display: 'inline-block', verticalAlign: 'middle' }} />
                Coûts associés
              </h3>
              {ticketCosts.length > 0 ? (
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
                          if (h > 0) result.push(`${h} h`);
                          if (m > 0) result.push(`${m} m`);
                          if (s > 0) result.push(`${s} s`);
                          
                          return result.join(' ');
                        };

                        // Formater la date
                        const formatCostDate = (dateStr) => {
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
                            <td>{formatCostDate(cost.begin_date)}</td>
                            <td>{formatCostDate(cost.end_date)}</td>
                            <td>{cost.budget ? parseFloat(cost.budget).toFixed(2) + ' €' : '-'}</td>
                            <td>{formatDuration(cost.actiontime)}</td>
                            <td>{hourlyRate.toFixed(2)} €</td>
                            <td>{costFixed.toFixed(2)} €</td>
                            <td>{costMaterial.toFixed(2)} €</td>
                            <td style={{ fontWeight: 'bold' }}>{total.toFixed(2)} €</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ fontWeight: 'bold', borderTop: '2px solid #cbd5e1', backgroundColor: '#f8fafc' }}>
                        <td colSpan={4}>Total</td>
                        <td>
                          {(() => {
                            const totalSecs = ticketCosts.reduce((sum, c) => sum + (parseInt(c.actiontime) || 0), 0);
                            if (totalSecs === 0) return '0 s';
                            const h = Math.floor(totalSecs / 3600);
                            const m = Math.floor((totalSecs % 3600) / 60);
                            const s = totalSecs % 60;
                            const parts = [];
                            if (h > 0) parts.push(`${h} h`);
                            if (m > 0) parts.push(`${m} m`);
                            if (s > 0) parts.push(`${s} s`);
                            return parts.join(' ');
                          })()}
                        </td>
                        <td>
                          {ticketCosts.reduce((sum, c) => {
                            const rate = parseFloat(c.cost_time || 0);
                            const h = (parseInt(c.actiontime) || 0) / 3600;
                            return sum + h * rate;
                          }, 0).toFixed(2)} €
                        </td>
                        <td>
                          {ticketCosts.reduce((sum, c) => sum + parseFloat(c.cost_fixed || 0), 0).toFixed(2)} €
                        </td>
                        <td>
                          {ticketCosts.reduce((sum, c) => sum + parseFloat(c.cost_material || 0), 0).toFixed(2)} €
                        </td>
                        <td style={{ color: '#2563eb' }}>
                          {ticketCosts.reduce((sum, c) => {
                            const rate = parseFloat(c.cost_time || 0);
                            const h = (parseInt(c.actiontime) || 0) / 3600;
                            return sum + h * rate + parseFloat(c.cost_fixed || 0) + parseFloat(c.cost_material || 0);
                          }, 0).toFixed(2)} €
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="no-assets">Aucun coût associé à ce ticket.</div>
              )}
            </div>
          </div>

          <div className="ticket-detail-actions">
            <Link to={`/frontoffice/tickets/${ticket.id}/edit`} className="edit-ticket-btn-action">
              <Edit size={16} />
              Modifier le ticket
            </Link>
          </div>
        </div>
      </div>
    </FrontOfficeLayout>
  );
};

export default TicketDetail;
