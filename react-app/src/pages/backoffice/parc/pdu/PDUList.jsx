import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import PDUService from '../../../../services/PDU/PDUService';
import '../../../../styles/list.css';

const PDUList = () => {
  const [pdus, setPdus] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPdus = async () => {
    setLoading(true);
    try {
      const data = await PDUService.getAllPDUs();
      setPdus(data);
    } catch (error) {
      console.error('Error fetching pdus:', error);
      setPdus([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPdus();
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
        <h1>Liste des PDUs</h1>
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
              {pdus.length > 0 ? (
                pdus.map((pdu) => (
                  <tr key={pdu.id}>
                    <td>{pdu.id}</td>
                    <td className="ticket-title">
                      {pdu.name || `PDU #${pdu.id}`}
                    </td>
                    <td>{formatDate(pdu.date_creation || pdu.date)}</td>
                    <td>{formatDate(pdu.date_mod)}</td>
                    <td className="action-cell">
                      <Link to={`/parc/pdus/${pdu.id}`} className="action-btn view-btn">
                        <Eye size={16} />
                        Détails
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-state">
                    Aucun PDU trouvé.
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

export default PDUList;
