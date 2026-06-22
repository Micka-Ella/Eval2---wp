import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  ChevronLeft,
  ChevronDown,
  LayoutDashboard,
  Box,
  Monitor,
  RefreshCw,
  Ticket,
  ShieldCheck,
} from 'lucide-react';
import '../../styles/layout.css';

const MENU_ITEMS = [
  { 
    icon: <Home size={20} />, 
    label: 'Accueil', 
    path: '/accueil' 
  },
  {
    icon: <Ticket size={20} />,
    label: 'Assistance',
    submenu: [
      { label: 'Tickets', path: '/tickets' },
      { label: 'Répartition des coûts', path: '/tickets/costs' },
      { label: 'RÃ©ouvertures et supercosts', path: '/tickets/cost-operations' },
      { label: 'Configuration Kanban', path: '/admin' }
    ]
  },
  {
    icon: <Monitor size={20} />,
    label: 'Parc',
    submenu: [
            { label: 'Tableau de bord', path: '/parc/dashboard' },
            { label: 'Ordinateurs', path: '/parc/computers' },
            { label: 'Moniteurs', path: '/parc/monitors' },
            { label: 'Périphériques', path: '/parc/peripherals' },
            { label: 'Logiciels', path: '/parc/software' },
            { label: 'Imprimantes', path: '/parc/printers' },
            { label: 'PDUs', path: '/parc/pdus' },
            { label: 'Baies', path: '/parc/racks' },
            { label: 'Téléphones', path: '/parc/phones' },
            { label: 'Châssis', path: '/parc/chassis' },
            { label: 'Matériel réseau', path: '/parc/network' },
            { label: 'Licences', path: '/parc/licenses' },
            { label: 'Matériel passif', path: '/parc/passiveEquipment' },
            { label: 'Cartouches', path: '/parc/cartridges' },
            { label: 'Consommables', path: '/parc/consumables' },
            { label: 'Câbles', path: '/parc/cables' },
            { label: 'Bases de données', path: '/parc/databaseInstances' },
            { label: 'Salles serveur', path: '/parc/dcRooms' }
          ]
  },
  { 
    icon: <RefreshCw size={20} />, 
    label: 'Réinitialisation', 
    path: '/reset' 
  },
  {
    icon: <Box size={20} />,
    label: 'Import',
    submenu: [
      { label: 'Import CSV', path: '/import' },
      { label: 'Import mouvement', path: '/import-mouvement' },
      { label: 'Import v2 (Rollback)', path: '/import-images', icon: <ShieldCheck size={13} /> },
    ]
  }
];

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
  const location = useLocation();
  // Set "Parc" submenu open by default
  const [openSubmenu, setOpenSubmenu] = useState('Parc');

  const toggleSubmenu = (label) => {
    setOpenSubmenu(openSubmenu === label ? '' : label);
  };

  const handleSubmenuClick = (label) => {
    if (isCollapsed) {
      toggleSidebar();
      setOpenSubmenu(label);
    } else {
      toggleSubmenu(label);
    }
  };

  useEffect(() => {
    if (!isCollapsed) {
      const activeItem = MENU_ITEMS.find(item => 
        item.submenu && item.submenu.some(sub => location.pathname === sub.path)
      );
      if (activeItem) {
        /* eslint-disable react-hooks/set-state-in-effect */
        setOpenSubmenu(activeItem.label);
      } else {
        setOpenSubmenu('');
      }
      /* eslint-enable react-hooks/set-state-in-effect */
    } else {
      setOpenSubmenu('');
    }
  }, [location.pathname, isCollapsed]);

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <LayoutDashboard size={20} />
          </div>
          <span className="sidebar-logo-text">GLPI 11</span>
        </div>
        {!isCollapsed && (
          <button className="sidebar-toggle" onClick={toggleSidebar} aria-label="Réduire le menu">
            <ChevronLeft size={20} />
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        {MENU_ITEMS.map((item, index) => {
          const isActive = location.pathname === item.path ||
            (item.submenu && item.submenu.some(sub => location.pathname === sub.path));
          const isOpen = openSubmenu === item.label;

          return (
            <React.Fragment key={index}>
              {item.separator && <div className="sidebar-separator" />}
              {item.submenu ? (
                <div>
                  <div
                    className={`nav-item has-submenu ${isActive ? 'active' : ''}`}
                    onClick={() => handleSubmenuClick(item.label)}
                  >
                    <div className="nav-item-content">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`chevron-icon ${isOpen ? 'rotated' : ''}`}
                    />
                  </div>
                  <div className={`nav-submenu ${isOpen ? 'open' : ''}`}>
                    {item.submenu.map((sub, subIndex) => {
                      const isSubActive = location.pathname === sub.path;
                      return (
                        <Link
                          key={subIndex}
                          to={sub.path}
                          className={`submenu-item ${isSubActive ? 'active' : ''}`}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          {sub.icon && <span style={{ opacity: 0.75, display: 'flex', alignItems: 'center' }}>{sub.icon}</span>}
                          <span>{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <Link
                  to={item.path}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
