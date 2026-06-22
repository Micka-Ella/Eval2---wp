import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Ticket, LayoutDashboard } from 'lucide-react';
import FrontOfficeLayout from '../../layouts/FrontOfficeLayout';
import '../../styles/FrontOffice.css';

const Accueil = () => {
  return (
    <FrontOfficeLayout>
      <div className="frontoffice-page welcome-container" style={{ textAlign: 'center', paddingTop: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '10px', color: '#0f172a' }}>
          Bienvenue sur le FrontOffice GLPI
        </h1>
        <p style={{ color: '#64748b', fontSize: '16px', marginBottom: '40px' }}>
          Gérez vos tickets de support et explorez les éléments du parc informatique.
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', maxWidth: '900px', margin: '0 auto' }}>
          <Link to="/frontoffice/elements" className="welcome-card" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '32px',
            backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', textDecoration: 'none',
            color: '#0f172a', transition: 'all 0.2s ease', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
          }}>
            <Box size={40} style={{ color: '#2563eb' }} />
            <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Éléments du parc</h2>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0, textAlign: 'center', lineHeight: '1.5' }}>
              Recherchez et consultez les ordinateurs, écrans, logiciels et autres matériels du parc.
            </p>
          </Link>

          <Link to="/frontoffice/kanban" className="welcome-card" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '32px',
            backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', textDecoration: 'none',
            color: '#0f172a', transition: 'all 0.2s ease', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
          }}>
            <LayoutDashboard size={40} style={{ color: '#f59e0b' }} />
            <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Suivi Kanban</h2>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0, textAlign: 'center', lineHeight: '1.5' }}>
              Visualisez et suivez l'avancement de vos tickets de support sous forme de tableau Kanban.
            </p>
          </Link>

          <Link to="/frontoffice/tickets" className="welcome-card" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '32px',
            backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', textDecoration: 'none',
            color: '#0f172a', transition: 'all 0.2s ease', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
          }}>
            <Ticket size={40} style={{ color: '#10b981' }} />
            <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Liste des tickets</h2>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0, textAlign: 'center', lineHeight: '1.5' }}>
              Déclarez un nouveau problème et accédez à la liste complète de vos tickets d'assistance.
            </p>
          </Link>
        </div>
      </div>
    </FrontOfficeLayout>
  );
};

export default Accueil;
