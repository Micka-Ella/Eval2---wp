import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import RackService from '../../../../services/Rack/RackService';
import '../../../../styles/list.css';

const RackList = () => {
  const [racks, setRacks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRacks = async () => {
    setLoading(true);
    try {
      const data = await RackService.getAllRacks();
      setRacks(data);
    } catch (error) {
      console.error('Error fetching racks:', error);
      setRacks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRacks();
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
        <h1>Liste des baies</h1>
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
              {racks.length > 0 ? (
                racks.map((rack) => (
                  <tr key={rack.id}>
                    <td>{rack.id}</td>
                    <td className="ticket-title">
                      {rack.name || `Baie #${rack.id}`}
                    </td>
                    <td>{formatDate(rack.date_creation || rack.date)}</td>
                    <td>{formatDate(rack.date_mod)}</td>
                    <td className="action-cell">
                      <Link to={`/parc/racks/${rack.id}`} className="action-btn view-btn">
                        <Eye size={16} />
                        Détails
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-state">
                    Aucune baie trouvée.
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

export default RackList;
