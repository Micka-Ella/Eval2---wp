import React, { useState, useEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import DocumentService from '../../services/Document/DocumentService';

/**
 * COMPOSANT : ItemPhotos
 * DESCRIPTION : Affiche la galerie photo d'un équipement GLPI avec sa Lightbox
 */
const ItemPhotos = ({ itemId, itemType }) => {
  const [documents, setDocuments] = useState([]);
  const [selectedImg, setSelectedImg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoading(true);
        const docs = await DocumentService.getDocumentsForItem(itemId, itemType);
        setDocuments(docs.filter(d => d.isImage));
      } catch (e) {
        console.warn(`Impossible de charger les images pour ${itemType} ID=${itemId}:`, e.message);
      } finally {
        setLoading(false);
      }
    };

    if (itemId) {
      fetchImages();
    }
  }, [itemId, itemType]);

  if (loading) {
    return (
      <div className="detail-card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ImageIcon size={18} /> Photos
        </h2>
        <div style={{ color: '#64748b', fontSize: '14px', padding: '12px 0' }}>
          Chargement des images...
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="detail-card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ImageIcon size={18} /> Photos
        </h2>
        {documents.length === 0 ? (
          <div style={{ color: '#94a3b8', fontSize: '14px', padding: '12px 0' }}>
            Aucune image associée à cet équipement.
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px' }}>
            {documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => setSelectedImg(doc)}
                style={{
                  cursor: 'pointer',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: '2px solid #e2e8f0',
                  width: '160px',
                  transition: 'border-color 0.2s, transform 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#2563eb'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
              >
                <img
                  src={doc.url}
                  alt={doc.name}
                  style={{ width: '100%', height: '110px', objectFit: 'cover', display: 'block' }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
                <div style={{ padding: '6px 8px', fontSize: '11px', color: '#64748b',
                              fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden',
                              textOverflow: 'ellipsis', background: '#f8fafc' }}>
                  {doc.name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selectedImg && (
        <div
          onClick={() => setSelectedImg(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, cursor: 'zoom-out',
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <img
              src={selectedImg.url}
              alt={selectedImg.name}
              style={{ maxWidth: '90vw', maxHeight: '80vh', borderRadius: '12px',
                       boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
            />
            <div style={{ color: '#fff', marginTop: '12px', fontSize: '14px', fontWeight: 600 }}>
              {selectedImg.name}
            </div>
            <button
              onClick={() => setSelectedImg(null)}
              style={{ marginTop: '12px', background: 'rgba(255,255,255,0.15)', border: 'none',
                       color: '#fff', padding: '8px 20px', borderRadius: '6px',
                       cursor: 'pointer', fontSize: '13px' }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ItemPhotos;
