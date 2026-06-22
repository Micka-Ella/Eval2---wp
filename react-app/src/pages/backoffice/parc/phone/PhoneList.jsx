import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import PhoneService from '../../../../services/Phone/PhoneService';
import '../../../../styles/list.css';

const PhoneList = () => {
  const [phones, setPhones] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPhones = async () => {
    setLoading(true);
    try {
      const data = await PhoneService.getAllPhones();
      setPhones(data);
    } catch (error) {
      console.error('Error fetching phones:', error);
      setPhones([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhones();
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
        <h1>Liste des téléphones</h1>
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
              {phones.length > 0 ? (
                phones.map((phone) => (
                  <tr key={phone.id}>
                    <td>{phone.id}</td>
                    <td className="ticket-title">
                      {phone.name || `Téléphone #${phone.id}`}
                    </td>
                    <td>{phone.otherserial || '-'}</td>
                    <td>{formatDate(phone.date_creation || phone.date)}</td>
                    <td>{formatDate(phone.date_mod)}</td>
                    <td className="action-cell">
                      <Link to={`/parc/phones/${phone.id}`} className="action-btn view-btn">
                        <Eye size={16} />
                        Détails
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty-state">
                    Aucun téléphone trouvé.
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

export default PhoneList;
