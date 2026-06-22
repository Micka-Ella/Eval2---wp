import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import SoftwareLicenseService from '../../../../services/SoftwareLicense/SoftwareLicenseService';
import '../../../../styles/list.css';

const LicenseList = () => {
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLicenses = async () => {
    setLoading(true);
    try {
      const data = await SoftwareLicenseService.getAllSoftwareLicenses();
      setLicenses(data);
    } catch (error) {
      console.error('Error fetching licenses:', error);
      setLicenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
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
        <h1>Liste des licences</h1>
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
              {licenses.length > 0 ? (
                licenses.map((license) => (
                  <tr key={license.id}>
                    <td>{license.id}</td>
                    <td className="ticket-title">
                      {license.name || `Licence #${license.id}`}
                    </td>
                    <td>{formatDate(license.date_creation || license.date)}</td>
                    <td>{formatDate(license.date_mod)}</td>
                    <td className="action-cell">
                      <Link to={`/parc/licenses/${license.id}`} className="action-btn view-btn">
                        <Eye size={16} />
                        Détails
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-state">
                    Aucune licence trouvée.
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

export default LicenseList;
