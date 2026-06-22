import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import DatabaseInstanceService from '../../../../services/DatabaseInstance/DatabaseInstanceService';
import '../../../../styles/list.css';

const DatabaseInstanceList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await DatabaseInstanceService.getAllDatabaseInstances();
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching database instances:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
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
        <h1>Liste des bases de données</h1>
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
                <th>Date de création</th>
                <th>Dernière modification</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td className="ticket-title">
                      {item.name || `Base de données #${item.id}`}
                    </td>
                    <td>{formatDate(item.date_creation || item.date)}</td>
                    <td>{formatDate(item.date_mod)}</td>
                    <td className="action-cell">
                      <Link to={`/parc/databaseInstances/${item.id}`} className="action-btn view-btn">
                        <Eye size={16} />
                        Détails
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-state">
                    Aucune base de données trouvée.
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

export default DatabaseInstanceList;
