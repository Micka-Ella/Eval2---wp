import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import SoftwareService from '../../../../services/Software/SoftwareService';
import '../../../../styles/list.css';

const SoftwareList = () => {
  const [software, setSoftware] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSoftware = async () => {
    setLoading(true);
    try {
      const data = await SoftwareService.getAllSoftware();
      setSoftware(data);
    } catch (error) {
      console.error('Error fetching software:', error);
      setSoftware([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSoftware();
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
        <h1>Liste des logiciels</h1>
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
              {software.length > 0 ? (
                software.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td className="ticket-title">
                      {item.name || `Logiciel #${item.id}`}
                    </td>
                    <td>{formatDate(item.date_creation || item.date)}</td>
                    <td>{formatDate(item.date_mod)}</td>
                    <td className="action-cell">
                      <Link to={`/parc/software/${item.id}`} className="action-btn view-btn">
                        <Eye size={16} />
                        Détails
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-state">
                    Aucun logiciel trouvé.
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

export default SoftwareList;
