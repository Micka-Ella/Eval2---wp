import React, { useState, useEffect } from 'react';
import {
  Laptop,
  Code,
  Monitor,
  Network,
  Printer,
  RefreshCw,
  Server,
  Database,
  Smartphone,
  Cpu,
  ShieldCheck,
  AlertCircle,
  Clock,
  AlertTriangle,
  ClipboardList,
  Users,
  CheckCircle,
  PauseCircle,
  Calendar,
  Trash2,
  Usb,
  Cable,
  Droplet,
  Package,
  Layers
} from 'lucide-react';
import ParcService from '../../../services/ParcService';
import { getAllItemTypes } from '../../../config/itemTypes';
import '../../../styles/ParcDashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const getTicketIcon = (iconName) => {
    switch (iconName) {
      case 'alert': return <AlertCircle size={32} />;
      case 'clock': return <Clock size={32} />;
      case 'warning': return <AlertTriangle size={32} />;
      case 'clipboard': return <ClipboardList size={32} />;
      case 'users': return <Users size={32} />;
      case 'check': return <CheckCircle size={32} />;
      case 'pause': return <PauseCircle size={32} />;
      case 'calendar': return <Calendar size={32} />;
      case 'trash': return <Trash2 size={32} />;
      default: return <AlertCircle size={32} />;
    }
  };

  const fetchStats = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const data = await ParcService.getStats();
      setStats(data);
    } catch (error) {
      console.error("Erreur lors de la récupération des stats:", error);
      setError("Impossible de charger les statistiques depuis l'API GLPI.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="dashboard-loader">
        <RefreshCw className="loader-icon" size={40} />
        <p className="loader-text">Chargement des statistiques du parc...</p>
      </div>
    );
  }

  return (
    <div className="parc-dashboard">
      <div className="dashboard-header">
        <div className="header-title-area">
          <h2>Tableau de Bord du Parc</h2>
          <p>Visualisation globale de l'inventaire matériel et logiciel de GLPI</p>
        </div>
        
        <div className="header-actions">
          {/* Nombre total d'éléments */}
          <div className="total-items-badge">
            <span className="total-items-label">Nombre d'éléments général:</span>
            <span className="total-items-value">{stats?.totalItems || 0}</span>
          </div>
          
          {error ? (
            <span className="badge-error">
              Erreur de connexion API
            </span>
          ) : (
            <span className="badge-live" title="Session API GLPI active">
              <span className="pulse-dot"></span>
              Connecté API GLPI
            </span>
          )}
          <button 
            className="btn-refresh"
            onClick={() => fetchStats(true)} 
            disabled={isRefreshing}
          >
            <RefreshCw 
              size={15} 
              className={`refresh-icon ${isRefreshing ? 'spinning' : ''}`}
            />
            {isRefreshing ? 'Actualisation...' : 'Actualiser'}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          {error} Vérifiez vos jetons d'accès dans le fichier `.env` ou la configuration réseau de votre serveur local Apache.
        </div>
      )}

      {/* Total Elements General Card */}
      <div className="total-elements-card">
        <div className="total-elements-label">Nombre d'éléments général</div>
        <div className="total-elements-value">{stats?.totalItems || 0}</div>
      </div>

      {/* Grid de 10 KPI Cards principales */}
      <div className="stats-grid stats-grid-dashboard">
        {/* Ordinateurs */}
        <div className="stat-card computers stat-card-custom">
          <div className="stat-card-header">
            <span className="stat-card-title">Ordinateur</span>
            <div className="stat-icon-wrapper">
              <Laptop size={20} />
            </div>
          </div>
          <div className="stat-card-body">
            <div className="stat-value">{stats?.computers?.total || 0}</div>
          </div>
        </div>

        {/* Logiciels */}
        <div className="stat-card software stat-card-custom">
          <div className="stat-card-header">
            <span className="stat-card-title">Logiciel</span>
            <div className="stat-icon-wrapper">
              <Code size={20} />
            </div>
          </div>
          <div className="stat-card-body">
            <div className="stat-value">{stats?.software?.total || 0}</div>
          </div>
        </div>

        {/* Imprimantes */}
        <div className="stat-card printers stat-card-custom">
          <div className="stat-card-header">
            <span className="stat-card-title">Imprimante</span>
            <div className="stat-icon-wrapper">
              <Printer size={20} />
            </div>
          </div>
          <div className="stat-card-body">
            <div className="stat-value">{stats?.printers?.total || 0}</div>
          </div>
        </div>

        {/* PDU */}
        <div className="stat-card pdus stat-card-custom">
          <div className="stat-card-header">
            <span className="stat-card-title">PDU</span>
            <div className="stat-icon-wrapper">
              <Server size={20} />
            </div>
          </div>
          <div className="stat-card-body">
            <div className="stat-value">{stats?.pdus?.total || 0}</div>
          </div>
        </div>

        {/* Baie */}
        <div className="stat-card racks stat-card-custom">
          <div className="stat-card-header">
            <span className="stat-card-title">Baie</span>
            <div className="stat-icon-wrapper">
              <Database size={20} />
            </div>
          </div>
          <div className="stat-card-body">
            <div className="stat-value">{stats?.racks?.total || 0}</div>
          </div>
        </div>

        {/* Téléphone */}
        <div className="stat-card phones stat-card-custom">
          <div className="stat-card-header">
            <span className="stat-card-title">Téléphone</span>
            <div className="stat-icon-wrapper">
              <Smartphone size={20} />
            </div>
          </div>
          <div className="stat-card-body">
            <div className="stat-value">{stats?.phones?.total || 0}</div>
          </div>
        </div>

        {/* Châssis */}
        <div className="stat-card chassis stat-card-custom">
          <div className="stat-card-header">
            <span className="stat-card-title">Châssis</span>
            <div className="stat-icon-wrapper">
              <Cpu size={20} />
            </div>
          </div>
          <div className="stat-card-body">
            <div className="stat-value">{stats?.chassis?.total || 0}</div>
          </div>
        </div>

        {/* Matériel réseau */}
        <div className="stat-card network stat-card-custom">
          <div className="stat-card-header">
            <span className="stat-card-title">Matériel réseau</span>
            <div className="stat-icon-wrapper">
              <Network size={20} />
            </div>
          </div>
          <div className="stat-card-body">
            <div className="stat-value">{stats?.network?.total || 0}</div>
          </div>
        </div>

        {/* Licence */}
        <div className="stat-card licenses stat-card-custom">
          <div className="stat-card-header">
            <span className="stat-card-title">Licence</span>
            <div className="stat-icon-wrapper">
              <ShieldCheck size={20} />
            </div>
          </div>
          <div className="stat-card-body">
            <div className="stat-value">{stats?.licenses?.total || 0}</div>
          </div>
        </div>

        {/* Moniteur */}
        <div className="stat-card monitors stat-card-custom">
          <div className="stat-card-header">
            <span className="stat-card-title">Moniteur</span>
            <div className="stat-icon-wrapper">
              <Monitor size={20} />
            </div>
          </div>
          <div className="stat-card-body">
            <div className="stat-value">{stats?.monitors?.total || 0}</div>
          </div>
        </div>

        {/* Périphérique */}
        <div className="stat-card peripherals stat-card-custom">
          <div className="stat-card-header">
            <span className="stat-card-title">Périphérique</span>
            <div className="stat-icon-wrapper">
              <Usb size={20} />
            </div>
          </div>
          <div className="stat-card-body">
            <div className="stat-value">{stats?.peripherals?.total || 0}</div>
          </div>
        </div>

        {/* Matériel passif */}
        <div className="stat-card passive-equipment stat-card-custom">
          <div className="stat-card-header">
            <span className="stat-card-title">Matériel passif</span>
            <div className="stat-icon-wrapper">
              <Layers size={20} />
            </div>
          </div>
          <div className="stat-card-body">
            <div className="stat-value">{stats?.passiveEquipment?.total || 0}</div>
          </div>
        </div>

        {/* Cartouche */}
        <div className="stat-card cartridges stat-card-custom">
          <div className="stat-card-header">
            <span className="stat-card-title">Cartouche</span>
            <div className="stat-icon-wrapper">
              <Droplet size={20} />
            </div>
          </div>
          <div className="stat-card-body">
            <div className="stat-value">{stats?.cartridges?.total || 0}</div>
          </div>
        </div>

        {/* Consommable */}
        <div className="stat-card consumables stat-card-custom">
          <div className="stat-card-header">
            <span className="stat-card-title">Consommable</span>
            <div className="stat-icon-wrapper">
              <Package size={20} />
            </div>
          </div>
          <div className="stat-card-body">
            <div className="stat-value">{stats?.consumables?.total || 0}</div>
          </div>
        </div>

        {/* Câbles */}
        <div className="stat-card cables stat-card-custom">
          <div className="stat-card-header">
            <span className="stat-card-title">Câble</span>
            <div className="stat-icon-wrapper">
              <Cable size={20} />
            </div>
          </div>
          <div className="stat-card-body">
            <div className="stat-value">{stats?.cables?.total || 0}</div>
          </div>
        </div>

        {/* Base de données */}
        <div className="stat-card databaseInstances stat-card-custom">
          <div className="stat-card-header">
            <span className="stat-card-title">Base de données</span>
            <div className="stat-icon-wrapper">
              <Database size={20} />
            </div>
          </div>
          <div className="stat-card-body">
            <div className="stat-value">{stats?.databaseInstances?.total || 0}</div>
          </div>
        </div>

        {/* Salle serveur */}
        <div className="stat-card dcRooms stat-card-custom">
          <div className="stat-card-header">
            <span className="stat-card-title">Salle serveur</span>
            <div className="stat-icon-wrapper">
              <Server size={20} />
            </div>
          </div>
          <div className="stat-card-body">
            <div className="stat-value">{stats?.dcRooms?.total || 0}</div>
          </div>
        </div>
      </div>

      {/* Section Tickets (en bas) */}
      <div className="tickets-section">
        <div className="tickets-header">
          <h3>Statistiques des Tickets</h3>
        </div>

        {/* Total Tickets */}
        <div className="total-tickets-card">
          <div className="total-tickets-label">Nombre de tickets général</div>
          <div className="total-tickets-value">{stats?.tickets?.total || 0}</div>
        </div>

        {/* Total Incident and Demande */}
        <div className="ticket-type-cards-grid">
          <div className="ticket-type-card incident">
            <div className="ticket-type-label">Total Incidents</div>
            <div className="ticket-type-value">{stats?.tickets?.byType?.incident || 0}</div>
          </div>
          <div className="ticket-type-card demande">
            <div className="ticket-type-label">Total Demandes</div>
            <div className="ticket-type-value">{stats?.tickets?.byType?.demande || 0}</div>
          </div>
        </div>

        {/* Détails par carte (style GLPI) */}
        <div className="ticket-cards-grid">
          {Object.values(stats?.tickets?.cards || {}).map((card, index) => (
            <div key={`ticket-card-${card.id || index}`} className="ticket-card" style={{ '--card-color': card.color }}>
              <div className="ticket-card-top">
                <div className="ticket-card-count">{card.count}</div>
                <div className="ticket-card-icon">
                  {getTicketIcon(card.icon)}
                </div>
              </div>
              <div className="ticket-card-name">{card.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
