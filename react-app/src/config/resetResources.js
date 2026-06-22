// src/config/resetResources.js
// Liste complète des ressources GLPI 11 supprimables et leurs endpoints API

export const RESET_RESOURCES = [
  // ─── Helpdesk ───────────────────────────────────────────────────────────
  { name: 'TicketTask', endpoint: '/TicketTask', label: 'Tâches de tickets', group: 'Helpdesk' },
  { name: 'TicketValidation', endpoint: '/TicketValidation', label: 'Validations de tickets', group: 'Helpdesk' },
  { name: 'ITILFollowup', endpoint: '/ITILFollowup', label: 'Suivis ITIL', group: 'Helpdesk' },
  { name: 'Solution', endpoint: '/ITILSolution', label: 'Solutions', group: 'Helpdesk' },
  { name: 'Ticket', endpoint: '/Ticket', label: 'Tickets', group: 'Helpdesk', isParent: true },
  { name: 'TicketRecurrent', endpoint: '/TicketRecurrent', label: 'Tickets récurrents', group: 'Helpdesk' },

  // ─── Gestion des Problèmes ──────────────────────────────────────────────
  { name: 'ProblemTask', endpoint: '/ProblemTask', label: 'Tâches de problèmes', group: 'Problèmes' },
  { name: 'Problem', endpoint: '/Problem', label: 'Problèmes', group: 'Problèmes', isParent: true },

  // ─── Gestion des Changements ────────────────────────────────────────────
  { name: 'ChangeTask', endpoint: '/ChangeTask', label: 'Tâches de changements', group: 'Changements' },
  { name: 'ChangeValidation', endpoint: '/ChangeValidation', label: 'Validations de changements', group: 'Changements' },
  { name: 'Change', endpoint: '/Change', label: 'Changements', group: 'Changements', isParent: true },

  // ─── Réseau ─────────────────────────────────────────────────────────────
  { name: 'NetworkPort', endpoint: '/NetworkPort', label: 'Ports réseau', group: 'Réseau' },
  { name: 'IPAddress', endpoint: '/IPAddress', label: 'Adresses IP', group: 'Réseau' },
  { name: 'IPNetwork', endpoint: '/IPNetwork', label: 'Réseaux IP', group: 'Réseau' },
  { name: 'NetworkName', endpoint: '/NetworkName', label: 'Noms réseau', group: 'Réseau' },

  // ─── Logiciels ──────────────────────────────────────────────────────────
  { name: 'SoftwareVersion', endpoint: '/SoftwareVersion', label: 'Versions de logiciels', group: 'Logiciels' },
  { name: 'SoftwareLicense', endpoint: '/SoftwareLicense', label: 'Licences de logiciels', group: 'Logiciels' },
  { name: 'Software', endpoint: '/Software', label: 'Logiciels', group: 'Logiciels', isParent: true },

  // ─── Parc Informatique ──────────────────────────────────────────────────
  { name: 'Computer', endpoint: '/Computer', label: 'Ordinateurs', group: 'Parc Informatique', isParent: true },
  { name: 'Monitor', endpoint: '/Monitor', label: 'Moniteurs', group: 'Parc Informatique', isParent: true },
  { name: 'Printer', endpoint: '/Printer', label: 'Imprimantes', group: 'Parc Informatique', isParent: true },
  { name: 'Peripheral', endpoint: '/Peripheral', label: 'Périphériques', group: 'Parc Informatique', isParent: true },
  { name: 'NetworkEquipment', endpoint: '/NetworkEquipment', label: 'Matériels Réseau', group: 'Parc Informatique', isParent: true },
  { name: 'Phone', endpoint: '/Phone', label: 'Téléphones', group: 'Parc Informatique', isParent: true },
  { name: 'Appliance', endpoint: '/Appliance', label: 'Appareils (Appliances)', group: 'Parc Informatique', isParent: true },
  { name: 'Rack', endpoint: '/Rack', label: 'Racks', group: 'Parc Informatique', isParent: true },
  { name: 'Enclosure', endpoint: '/Enclosure', label: 'Châssis (Enclosures)', group: 'Parc Informatique', isParent: true },
  { name: 'PDU', endpoint: '/PDU', label: 'PDU', group: 'Parc Informatique', isParent: true },
  { name: 'PassiveDCEquipment', endpoint: '/PassiveDCEquipment', label: 'Matériel passif', group: 'Parc Informatique', isParent: true },
  { name: 'Cable', endpoint: '/Cable', label: 'Câbles', group: 'Parc Informatique', isParent: true },
  { name: 'DCRoom', endpoint: '/DCRoom', label: 'Salles serveur', group: 'Parc Informatique', isParent: true },

  // ─── Virtualisation & BDD ────────────────────────────────────────────────
  { name: 'VirtualMachine', endpoint: '/VirtualMachine', label: 'Machines virtuelles', group: 'Virtualisation' },
  { name: 'Cluster', endpoint: '/Cluster', label: 'Clusters', group: 'Virtualisation' },
  { name: 'DatabaseInstance', endpoint: '/DatabaseInstance', label: 'Bases de données', group: 'Bases de données' },

  // ─── Contrats & Finances ────────────────────────────────────────────────
  { name: 'ContractCost', endpoint: '/ContractCost', label: 'Coûts de contrats', group: 'Contrats & Finances' },
  { name: 'Contract', endpoint: '/Contract', label: 'Contrats', group: 'Contrats & Finances', isParent: true },
  { name: 'Budget', endpoint: '/Budget', label: 'Budgets', group: 'Contrats & Finances' },
  { name: 'Infocom', endpoint: '/Infocom', label: 'Informations financières', group: 'Contrats & Finances' },

  // ─── Tiers & Contacts ───────────────────────────────────────────────────
  { name: 'Supplier', endpoint: '/Supplier', label: 'Fournisseurs', group: 'Fournisseurs & Contacts', isParent: true },
  { name: 'Contact', endpoint: '/Contact', label: 'Contacts', group: 'Fournisseurs & Contacts' },

  // ─── Consommables & Cartouches ──────────────────────────────────────────
  { name: 'Consumable', endpoint: '/Consumable', label: 'Consommables', group: 'Consommables' },
  { name: 'ConsumableItem', endpoint: '/ConsumableItem', label: 'Modèles de consommables', group: 'Consommables', isParent: true },
  { name: 'Cartridge', endpoint: '/Cartridge', group: 'Cartouches' },
  { name: 'CartridgeItem', endpoint: '/CartridgeItem', label: 'Modèles de cartouches', group: 'Cartouches', isParent: true },

  // ─── Divers ─────────────────────────────────────────────────────────────
  { name: 'Document', endpoint: '/Document', label: 'Documents', group: 'Documents' },
  { name: 'Reservation', endpoint: '/Reservation', label: 'Réservations', group: 'Réservations' },
  { name: 'ReservationItem', endpoint: '/ReservationItem', label: 'Éléments réservables', group: 'Réservations', isParent: true },
  { name: 'ProjectTask', endpoint: '/ProjectTask', label: 'Tâches de projets', group: 'Projets' },
  { name: 'Project', endpoint: '/Project', label: 'Projets', group: 'Projets', isParent: true },
  { name: 'KnowbaseItem', endpoint: '/KnowbaseItem', label: 'Base de connaissances', group: 'Connaissances' },
  { name: 'Location', endpoint: '/Location', label: 'Emplacements', group: 'Localisation' },
  { name: 'User', endpoint: '/User', label: 'Utilisateurs', group: 'Utilisateurs', skipIds: [1, 2, 3, 4, 5, 6] }
];

/**
 * Dépendances pour l'UI : sélection automatique des tables filles 
 * quand on sélectionne une ressource parente.
 */
export const DEPENDENCIES_UI = {
  Ticket: ['TicketTask', 'TicketValidation', 'ITILFollowup', 'Solution'],
  Problem: ['ProblemTask'],
  Change: ['ChangeTask', 'ChangeValidation'],
  Software: ['SoftwareVersion', 'SoftwareLicense'],
  Contract: ['ContractCost'],
  ConsumableItem: ['Consumable'],
  CartridgeItem: ['Cartridge'],
  ReservationItem: ['Reservation'],
  Project: ['ProjectTask']
};

// Helpers
export const getAllGroups = () => [...new Set(RESET_RESOURCES.map(r => r.group))];
export const getAllNames = () => new Set(RESET_RESOURCES.map(r => r.name));
export const getParentNames = () => new Set(RESET_RESOURCES.filter(r => r.isParent).map(r => r.name));
export const getDefaultSelected = () => {
  const standardGroups = ['Helpdesk', 'Problèmes', 'Changements', 'Réseau', 'Logiciels', 'Parc Informatique', 'Documents', 'Localisation'];
  const names = RESET_RESOURCES
    .filter(r => standardGroups.includes(r.group))
    .map(r => r.name);
  return new Set(names);
};
