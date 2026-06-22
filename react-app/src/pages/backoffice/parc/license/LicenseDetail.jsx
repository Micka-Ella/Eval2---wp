import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, FileText, Download } from 'lucide-react';
import SoftwareLicenseService from '../../../../services/SoftwareLicense/SoftwareLicenseService';
import DocumentService from '../../../../services/Document/DocumentService';
import '../../../../styles/detail.css';

const LicenseDetail = () => {
  const { id } = useParams();
  const [license, setLicense] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLicense = async () => {
      try {
        setLoading(true);
        const [licenseData, documentsData] = await Promise.all([
          SoftwareLicenseService.getSoftwareLicenseById(id),
          DocumentService.getDocumentsForItem('SoftwareLicense', id)
        ]);
        setLicense(licenseData);
        setDocuments(documentsData);
      } catch (error) {
        console.error('Error fetching license:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchLicense();
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
        <div className="loading-state">Chargement de la licence...</div>
      </div>
    );
  }

  if (!license) {
    return (
      <div className="ticket-detail-page">
        <div className="empty-state">Licence introuvable</div>
      </div>
    );
  }

  return (
    <div className="ticket-detail-page">
      <div className="detail-header">
        <Link to="/parc/licenses" className="back-btn">
          <ArrowLeft size={16} />
          Retour à la liste
        </Link>
        <h1>Licence #{license.id} - {license.name || 'Sans titre'}</h1>
      </div>

      <div className="detail-content">
        <div className="detail-card">
          <h2>Informations générales</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <div className="detail-label">ID</div>
              <div className="detail-value">{license.id}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Nom</div>
              <div className="detail-value">{license.name || 'Non défini'}</div>
            </div>
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
              <div className="detail-value">{formatDate(license.date_creation || license.date)}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">
                <Clock size={16} />
                Dernière modification
              </div>
              <div className="detail-value">{formatDate(license.date_mod)}</div>
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

export default LicenseDetail;
