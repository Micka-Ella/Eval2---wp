import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Filter, ArrowUpDown, Eye, User } from 'lucide-react';
import TicketService from '../../services/Ticket/TicketService';
import UserService from '../../services/User/UserService';
import '../../styles/list.css';

const TicketList = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [userMap, setUserMap] = useState({}); // { userId: userName }

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const fetchTickets = async () => {
    setLoading(true);
    const start = (currentPage - 1) * itemsPerPage;
    const params = {
      start,
      limit: itemsPerPage,
    };
    if (statusFilter) {
      params.status = statusFilter;
    }
    try {
      const result = await TicketService.getTickets(params);
      console.log('Tickets data:', result.tickets);
      
      // Apply type filter client-side
      let filteredTickets = result.tickets;
      if (typeFilter) {
        filteredTickets = filteredTickets.filter(ticket => ticket.type === Number(typeFilter));
      }
      
      setTickets(filteredTickets);
      setTotalItems(result.totalItems); // Note: We'll keep totalItems from API, but displayed count is filtered
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setTickets([]);
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
  }, [currentPage, itemsPerPage, statusFilter, typeFilter, userMap]);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: '1', label: 'Nouveau' },
    { value: '2', label: 'En cours (Attribué)' },
    { value: '3', label: 'En cours (Planifié)' },
    { value: '4', label: 'En attente' },
    { value: '5', label: 'Résolu' },
    { value: '6', label: 'Clos' },
  ];

  const priorityOptions = [
    { value: 1, label: 'Très basse', color: '#9e9e9e' },
    { value: 2, label: 'Basse', color: '#4caf50' },
    { value: 3, label: 'Moyenne', color: '#ff9800' },
    { value: 4, label: 'Haute', color: '#f44336' },
    { value: 5, label: 'Très haute', color: '#9c27b0' },
    { value: 6, label: 'Majeure', color: '#b71c1c' },
  ];

  const typeOptions = [
    { value: '', label: 'Tous les types' },
    { value: 1, label: 'Incident' },
    { value: 2, label: 'Demande' },
  ];

  const getStatusName = (statusId) => {
    const option = statusOptions.find(opt => opt.value === String(statusId));
    return option ? option.label : 'Statut inconnu';
  };

  const getPriorityInfo = (priorityId) => {
    const option = priorityOptions.find(opt => opt.value === priorityId);
    return option || { label: 'Priorité inconnue', color: '#9e9e9e' };
  };

  const getTypeName = (typeId) => {
    const option = typeOptions.find(opt => opt.value === typeId);
    return option ? option.label : 'Type inconnu';
  };

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

  return (
    <div className="ticket-list-page">
      <div className="page-header">
        <h1>Liste des tickets</h1>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="filter-item">
          <Filter size={16} />
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="filter-item">
          <Filter size={16} />
          <select
            className="filter-select"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="ticket-table-container">
        {loading ? (
          <div className="loading-state">Chargement...</div>
        ) : (
          <table className="ticket-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Titre</th>
                <th>Utilisateur</th>
                <th>Statut</th>
                <th>Priorité</th>
                <th>Type</th>
                <th>Dernière modification</th>
                <th>Date d'ouverture</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length > 0 ? (
                tickets.map((ticket) => {
                  const priorityInfo = getPriorityInfo(ticket.priority);
                  const userId = ticket.users_id_recipient;
                  const userName = userMap[userId] 
                        || (userId ? `Utilisateur #${userId}` : 'Inconnu');
                  return (
                    <tr key={ticket.id}>
                      <td>{ticket.id}</td>
                      <td className="ticket-title">
                        {ticket.name || `Ticket #${ticket.id}`}
                      </td>
                      <td>
                        <div className="ticket-user">
                          <User size={14} style={{ marginRight: '4px' }} />
                          {userName}
                        </div>
                      </td>
                      <td>
                        <span className="status-badge">
                          {getStatusName(ticket.status)}
                        </span>
                      </td>
                      <td>
                        <span 
                          className="priority-badge"
                          style={{ backgroundColor: priorityInfo.color + '20', color: priorityInfo.color, borderColor: priorityInfo.color }}
                        >
                          {priorityInfo.label}
                        </span>
                      </td>
                      <td>{getTypeName(ticket.type)}</td>
                      <td>{formatDate(ticket.date_mod)}</td>
                      <td>{formatDate(ticket.date)}</td>
                      <td className="action-cell">
                        <Link to={`/tickets/${ticket.id}`} className="action-btn view-btn">
                          <Eye size={16} />
                          Détails
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="empty-state">
                    Aucun ticket trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalItems > 0 && (
        <div className="pagination-bar">
          <div className="pagination-info">
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="per-page-select"
            >
              <option value={10}>10 lignes / page</option>
              <option value={20}>20 lignes / page</option>
              <option value={50}>50 lignes / page</option>
              <option value={100}>100 lignes / page</option>
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
    </div>
  );
};

export default TicketList;
