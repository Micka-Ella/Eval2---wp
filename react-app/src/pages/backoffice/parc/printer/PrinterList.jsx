import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import PrinterService from '../../../../services/Printer/PrinterService';
import '../../../../styles/list.css';

const PrinterList = () => {
  const [printers, setPrinters] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPrinters = async () => {
    setLoading(true);
    try {
      const data = await PrinterService.getAllPrinters();
      setPrinters(data);
    } catch (error) {
      console.error('Error fetching printers:', error);
      setPrinters([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrinters();
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
        <h1>Liste des imprimantes</h1>
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
              {printers.length > 0 ? (
                printers.map((printer) => (
                  <tr key={printer.id}>
                    <td>{printer.id}</td>
                    <td className="ticket-title">
                      {printer.name || `Imprimante #${printer.id}`}
                    </td>
                    <td>{printer.otherserial || '-'}</td>
                    <td>{formatDate(printer.date_creation || printer.date)}</td>
                    <td>{formatDate(printer.date_mod)}</td>
                    <td className="action-cell">
                      <Link to={`/parc/printers/${printer.id}`} className="action-btn view-btn">
                        <Eye size={16} />
                        Détails
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty-state">
                    Aucune imprimante trouvée.
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

export default PrinterList;
