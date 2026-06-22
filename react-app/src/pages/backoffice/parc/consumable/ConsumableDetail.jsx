import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Download } from 'lucide-react';
import ConsumableItemService from '../../../../services/ConsumableItem/ConsumableItemService';
import DocumentService from '../../../../services/Document/DocumentService';
import '../../../../styles/detail.css';

const ConsumableDetail = () => {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        const [itemData, documentsData] = await Promise.all([
          ConsumableItemService.getConsumableItemById(id),
          DocumentService.getDocumentsForItem('ConsumableItem', id)
        ]);
        setItem(itemData);
        setDocuments(documentsData || []);
      } catch (error) {
        console.error('Error fetching consumable:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchItem();
    }
  }, [id]);

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

  if (loading) {
    return (
      <div className="ticket-detail-page">
        <div className="loading-state">Chargement du consommable...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="ticket-detail-page">
        <div className="empty-state">Consommable introuvable</div>
      </div>
    );
  }

  return (
    <div className="ticket-detail-page">
      <div className="detail-header">
        <Link to="/parc/consumables" className="back-btn">
          <ArrowLeft size={16} />
          Retour à la liste
        </Link>
        <h1>Consommable #{item.id} - {item.name || 'Sans titre'}</h1>
      </div>

      <div className="detail-content">
        <div className="detail-card">
          <h2>Informations générales</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <div className="detail-label">ID</div>
              <div className="detail-value">{item.id}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Nom</div>
              <div className="detail-value">{item.name || 'Non défini'}</div>
            </div>
            {item.otherserial && (
              <div className="detail-item">
                <div className="detail-label">Numéro d'inventaire</div>
                <div className="detail-value">{item.otherserial}</div>
              </div>
            )}
          </div>
        </div>

        <div className="detail-card">
          <h2>Dates</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <div className="detail-label">
                <Calendar size={16} />
                Date de création
              </div>
              <div className="detail-value">{formatDate(item.date_creation || item.date)}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">
                <Clock size={16} />
                Dernière modification
              </div>
              <div className="detail-value">{formatDate(item.date_mod)}</div>
            </div>
          </div>
        </div>

        <div className="detail-card">
          <h2>Documents</h2>
          {documents.length > 0 ? (
            <div className="documents-table-container">
              <table className="documents-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Entité</th>
                    <th>Fichier</th>
                    <th>Type MIME</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id}>
                      <td>{doc.name || '-'}</td>
                      <td>{doc.entities_id || '-'}</td>
                      <td>{doc.filename || '-'}</td>
                      <td>{doc.mime || '-'}</td>
                      <td>{doc.date ? new Date(doc.date).toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                      <td>
                        <a
                          href={DocumentService.getDocumentDownloadUrl(doc.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="download-link"
                        >
                          <Download size={16} />
                          Télécharger
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">Aucun document associé</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsumableDetail;
