import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Ticket, Calendar, Clock, User, AlertCircle, Filter } from 'lucide-react';
import TicketService from '../../services/Ticket/TicketService';
import AuthService from '../../services/AuthService';
import UserService from '../../services/User/UserService';
import FrontOfficeLayout from '../../layouts/FrontOfficeLayout';
import '../../styles/FrontOffice.css';

const FrontOfficeTicketList = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [userMap, setUserMap] = useState({}); // { userId: userName }
  const [ticketRequesterMap, setTicketRequesterMap] = useState({});
  const [ticketAssigneeMap, setTicketAssigneeMap] = useState({});

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Temporary filter states (to apply when button is clicked)
  const [tempStatusFilter, setTempStatusFilter] = useState('');
  const [tempPriorityFilter, setTempPriorityFilter] = useState('');
  const [tempTypeFilter, setTempTypeFilter] = useState('');
  const [tempSearchQuery, setTempSearchQuery] = useState('');

  const navigate = useNavigate();
  const currentUser = AuthService.getCurrentUser();

  const priorityOptions = [
    { value: '', label: 'Toutes les priorités' },
    { value: 1, label: 'Très basse', color: '#9e9e9e' },
    { value: 2, label: 'Basse', color: '#4caf50' },
    { value: 3, label: 'Moyenne', color: '#ff9800' },
    { value: 4, label: 'Haute', color: '#f44336' },
    { value: 5, label: 'Très haute', color: '#9c27b0' },
    { value: 6, label: 'Majeure', color: '#b71c1c' },
  ];

  const statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 1, label: 'Nouveau', color: '#03a9f4' },
    { value: 2, label: 'En cours (Attribué)', color: '#2196f3' },
    { value: 3, label: 'En cours (Planifié)', color: '#673ab7' },
    { value: 4, label: 'En attente', color: '#ffc107' },
    { value: 5, label: 'Résolu', color: '#4caf50' },
    { value: 6, label: 'Clos', color: '#9e9e9e' },
  ];

  const typeOptions = [
    { value: '', label: 'Tous les types' },
    { value: 1, label: 'Incident' },
    { value: 2, label: 'Demande' },
  ];

  const getStatusInfo = (statusId) => {
    const option = statusOptions.find(opt => opt.value === statusId);
    return option || { label: 'Inconnu', color: '#9e9e9e' };
  };

  const getPriorityInfo = (priorityId) => {
    const option = priorityOptions.find(opt => opt.value === priorityId);
    return option || { label: 'Inconnu', color: '#9e9e9e' };
  };

  const getTypeInfo = (typeId) => {
    const option = typeOptions.find(opt => opt.value === typeId);
    return option || { label: 'Inconnu' };
  };

  const applyFilters = () => {
    setStatusFilter(tempStatusFilter);
    setPriorityFilter(tempPriorityFilter);
    setTypeFilter(tempTypeFilter);
    setSearchQuery(tempSearchQuery);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setTempStatusFilter('');
    setTempPriorityFilter('');
    setTempTypeFilter('');
    setTempSearchQuery('');
    setStatusFilter('');
    setPriorityFilter('');
    setTypeFilter('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      console.log('Current user:', currentUser);

      const params = {
        start: 0,
        limit: 999, // Fetch MANY tickets
      };
      
      if (statusFilter) {
        params.status = statusFilter;
      }

      const [result, relations] = await Promise.all([
        TicketService.getTickets(params),
        TicketService.getTicketUsers()
      ]);
      console.log('Result from getTickets:', result);

      const rels = Array.isArray(relations) ? relations : [];
      const reqMap = {};
      const assignMap = {};
      rels.forEach(rel => {
        if (Number(rel.type) === 1) {
          reqMap[rel.tickets_id] = rel.users_id;
        } else if (Number(rel.type) === 2) {
          if (!assignMap[rel.tickets_id]) {
            assignMap[rel.tickets_id] = [];
          }
          assignMap[rel.tickets_id].push(rel.users_id);
        }
      });
      setTicketRequesterMap(reqMap);
      setTicketAssigneeMap(assignMap);

      // Apply ALL filters client-side
      let filtered = [...result.tickets];
      
      // Filter for current user's tickets (using users_id_recipient OR requester ID!)
      console.log('Current user id:', currentUser?.id);
      if (currentUser?.id) {
        filtered = filtered.filter(t => {
          const reqId = reqMap[t.id];
          const match = Number(t.users_id_recipient) === Number(currentUser.id) ||
                        (reqId && Number(reqId) === Number(currentUser.id));
          if (match) {
            console.log('Match found:', t);
          }
          return match;
        });
      }
      
      if (priorityFilter) {
        filtered = filtered.filter(t => t.priority === Number(priorityFilter));
      }

      if (typeFilter) {
        filtered = filtered.filter(t => t.type === Number(typeFilter));
      }
      
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(t => 
          t.name?.toLowerCase().includes(query) ||
          t.content?.toLowerCase().includes(query) ||
          String(t.id).includes(query)
        );
      }

      console.log('Filtered tickets:', filtered);

      // Apply pagination on filtered results
      const start = (currentPage - 1) * itemsPerPage;
      const paginated = filtered.slice(start, start + itemsPerPage);
      
      setTickets(paginated);
      setTotalItems(filtered.length);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all users once on mount
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
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [currentUser?.id, currentPage, itemsPerPage, statusFilter, priorityFilter, typeFilter, searchQuery, userMap]);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <FrontOfficeLayout>
      <div className="frontoffice-page">
        <div className="ticket-list-header">
          <h1>Tickets</h1>
          <Link to="/frontoffice/tickets/add" className="btn-add-ticket">
            <Plus size={18} />
            Créer un ticket
          </Link>
        </div>

        {/* Filters Section */}
        <div className="filters-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="filter-group">
              <label><Filter size={16} /> Recherche</label>
              <input
                type="text"
                placeholder="Rechercher par titre, ID..."
                value={tempSearchQuery}
                onChange={(e) => setTempSearchQuery(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>Statut</label>
              <select
                value={tempStatusFilter}
                onChange={(e) => setTempStatusFilter(e.target.value)}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Priorité</label>
              <select
                value={tempPriorityFilter}
                onChange={(e) => setTempPriorityFilter(e.target.value)}
              >
                {priorityOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Type</label>
              <select
                value={tempTypeFilter}
                onChange={(e) => setTempTypeFilter(e.target.value)}
              >
                {typeOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center' }}>
            <button
              onClick={resetFilters}
              style={{
                padding: '8px 16px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: '#fff',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Réinitialiser
            </button>
            <button
              onClick={applyFilters}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: '#007bff',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Appliquer la recherche
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">Chargement des tickets...</div>
        ) : (
          <>
            <div className="tickets-table-container">
              <table className="tickets-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Titre</th>
                    <th>Demandeur</th>
                    <th>Attributeur(s)</th>
                    <th>Statut</th>
                    <th>Priorité</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.length > 0 ? (
                    tickets.map((ticket) => {
                      const statusInfo = getStatusInfo(ticket.status);
                      const priorityInfo = getPriorityInfo(ticket.priority);
                      const typeInfo = getTypeInfo(ticket.type);
                      // Get requester user ID from ticketRequesterMap, fallback to users_id_recipient
                      const userId = ticketRequesterMap[ticket.id] || ticket.users_id_recipient;
                      const userName = userMap[userId] 
                        || (userId ? `Utilisateur #${userId}` : 'Inconnu');

                      // Get assignee user names
                      const assigneeIds = ticketAssigneeMap[ticket.id] || [];
                      const assigneeNames = assigneeIds.map(id => userMap[id] || `Utilisateur #${id}`);

                      return (
                        <tr key={ticket.id} className="ticket-row">
                          <td>{ticket.id}</td>
                          <td className="ticket-name">
                            <div className="ticket-name-content">
                              <AlertCircle size={16} style={{ marginRight: '8px', color: statusInfo.color }} />
                              {ticket.name}
                            </div>
                          </td>
                          <td>
                            <div className="ticket-user">
                              <User size={14} style={{ marginRight: '4px' }} />
                              {userName}
                            </div>
                          </td>
                          <td>
                            {assigneeNames.length > 0 ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {assigneeNames.map((name, idx) => (
                                  <span 
                                    key={idx} 
                                    style={{ 
                                      fontSize: '0.8rem', 
                                      padding: '2px 8px', 
                                      borderRadius: '12px', 
                                      background: '#f1f5f9', 
                                      color: '#475569',
                                      border: '1px solid #e2e8f0',
                                      fontWeight: '500'
                                    }}
                                  >
                                    {name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>Non attribué</span>
                            )}
                          </td>
                          <td>
                            <span className="status-badge" style={{ backgroundColor: statusInfo.color + '20', color: statusInfo.color }}>
                              {statusInfo.label}
                            </span>
                          </td>
                          <td>
                            <span className="priority-badge" style={{ backgroundColor: priorityInfo.color + '20', color: priorityInfo.color }}>
                              {priorityInfo.label}
                            </span>
                          </td>
                          <td>{typeInfo.label}</td>
                          <td>
                            <div className="ticket-date">
                              <Calendar size={14} style={{ marginRight: '4px' }} />
                              {new Date(ticket.date).toLocaleDateString('fr-FR')}
                            </div>
                          </td>
                          <td>
                            <Link to={`/frontoffice/tickets/${ticket.id}`} className="view-details-link">
                              Voir détails
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="empty-state">
                        Aucun ticket trouvé
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && totalItems > 0 && (
              <div className="pagination-bar" style={{ background: 'white', borderRadius: '12px', marginTop: '16px', padding: '16px' }}>
                <div className="pagination-info">
                  <select
                    value={itemsPerPage}
                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="per-page-select"
                  >
                    <option value={10}>10 par page</option>
                    <option value={20}>20 par page</option>
                    <option value={50}>50 par page</option>
                  </select>
                </div>
                <div className="pagination-controls">
                  <button
                    className="pagination-btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Précédent
                  </button>
                  <span className="pagination-info-text">
                    Page {currentPage} sur {totalPages}
                  </span>
                  <button
                    className="pagination-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </FrontOfficeLayout>
  );
};

export default FrontOfficeTicketList;