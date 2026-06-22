import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Box, Ticket, LayoutDashboard } from 'lucide-react';

const FrontOfficeNavbar = () => {
  const location = useLocation();

  const isActive = (path, exact = false) => {
    const active = exact ? location.pathname === path : location.pathname.startsWith(path);
    return active ? 'active' : '';
  };

  return (
    <nav className="frontoffice-navbar">
      <div className="nav-container">
        <div className="nav-logo">GLPI FrontOffice</div>
        <div className="nav-links">
          <Link to="/frontoffice" className={`nav-link ${isActive('/frontoffice', true)}`}>
            <Home size={18} />
            Accueil
          </Link>
          <Link to="/frontoffice/tickets" className={`nav-link ${isActive('/frontoffice/tickets')}`}>
            <Ticket size={18} />
            Tickets
          </Link>
          <Link to="/frontoffice/kanban" className={`nav-link ${isActive('/frontoffice/kanban')}`}>
            <LayoutDashboard size={18} />
            Kanban
          </Link>
          <Link to="/frontoffice/elements" className={`nav-link ${isActive('/frontoffice/elements')}`}>
            <Box size={18} />
            Éléments
          </Link>
          <Link to="/" className="nav-link back-link">
            Retour au BackOffice
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default FrontOfficeNavbar;
