import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import MonitorService from '../../../../services/Monitor/MonitorService';
import '../../../../styles/list.css';

const MonitorList = () => {
  const [monitors, setMonitors] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMonitors = async () => {
    setLoading(true);
    try {
      const data = await MonitorService.getAllMonitors();
      setMonitors(data);
    } catch (error) {
      console.error('Error fetching monitors:', error);
      setMonitors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitors();
  }, []);

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
        <h1>Liste des moniteurs</h1>
      </div>

      <div className="ticket-table-container">
        {loading ? (
          <div className="loading-state">Chargement...</div>
        ) : (
          <table className="ticket-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nom</th>
                <th>Numéro d'inventaire</th>
                <th>Date de création</th>
                <th>Dernière modification</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {monitors.length > 0 ? (
                monitors.map((monitor) => (
                  <tr key={monitor.id}>
                    <td>{monitor.id}</td>
                    <td className="ticket-title">
                      {monitor.name || `Moniteur #${monitor.id}`}
                    </td>
                    <td>{monitor.otherserial || '-'}</td>
                    <td>{formatDate(monitor.date_creation || monitor.date)}</td>
                    <td>{formatDate(monitor.date_mod)}</td>
                    <td className="action-cell">
                      <Link to={`/parc/monitors/${monitor.id}`} className="action-btn view-btn">
                        <Eye size={16} />
                        Détails
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty-state">
                    Aucun moniteur trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default MonitorList;
