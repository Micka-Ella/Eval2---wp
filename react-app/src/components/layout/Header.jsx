import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, LogOut, ExternalLink } from 'lucide-react';
import '../../styles/layout.css';
import AuthService from '../../services/AuthService';

const Header = ({ isSidebarCollapsed, toggleSidebar }) => {
  const user = AuthService.getCurrentUser();

  const handleLogout = () => {
    AuthService.logout();
  };

  return (
    <header className="header">
      <div className="header-left">
        <button className="header-toggle" onClick={toggleSidebar} aria-label="Basculer le menu">
          <Menu size={20} />
        </button>
      </div>
      <div className="header-right">
        <div className="user-menu">
          <Link 
            to="/frontoffice" 
            className="header-link frontoffice-btn"
          >
            <ExternalLink size={16} />
            FrontOffice
          </Link>
          <div className="user-avatar">{user?.name ? user.name.substring(0, 2).toUpperCase() : 'AD'}</div>
          <div className="user-info">
            <span className="user-name">{user?.realname || user?.name || 'AD Admin'}</span>
            <span className="user-role">Utilisateur GLPI</span>
          </div>
          <button 
            onClick={handleLogout}
            className="header-logout-btn"
            title="Se déconnecter"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
