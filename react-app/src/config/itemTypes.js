import {
  Laptop,
  Code,
  Monitor,
  Network,
  Printer,
  Server,
  Database,
  Smartphone,
  Cpu,
  ShieldCheck,
  Usb,
  Layers,
  Droplet,
  Package,
  Cable
} from 'lucide-react';

/**
 * Configuration complète des types d'éléments GLPI
 * Centralisée pour une maintenance facile
 */
export const ITEM_TYPES = [
  {
    key: 'computers',
    endpoint: '/Computer',
    label: 'Ordinateur',
    icon: Laptop,
    itemType: 'Computer'
  },
  {
    key: 'software',
    endpoint: '/Software',
    label: 'Logiciel',
    icon: Code,
    itemType: 'Software'
  },
  {
    key: 'printers',
    endpoint: '/Printer',
    label: 'Imprimante',
    icon: Printer,
    itemType: 'Printer'
  },
  {
    key: 'pdus',
    endpoint: '/Pdu',
    label: 'PDU',
    icon: Server,
    itemType: 'Pdu'
  },
  {
    key: 'racks',
    endpoint: '/Rack',
    label: 'Baie',
    icon: Database,
    itemType: 'Rack'
  },
  {
    key: 'phones',
    endpoint: '/Phone',
    label: 'Téléphone',
    icon: Smartphone,
    itemType: 'Phone'
  },
  {
    key: 'chassis',
    endpoint: '/Enclosure',
    label: 'Châssis',
    icon: Cpu,
    itemType: 'Enclosure'
  },
  {
    key: 'network',
    endpoint: '/NetworkEquipment',
    label: 'Matériel réseau',
    icon: Network,
    itemType: 'NetworkEquipment'
  },
  {
    key: 'licenses',
    endpoint: '/SoftwareLicense',
    label: 'Licence',
    icon: ShieldCheck,
    itemType: 'SoftwareLicense'
  },
  {
    key: 'monitors',
    endpoint: '/Monitor',
    label: 'Moniteur',
    icon: Monitor,
    itemType: 'Monitor'
  },
  {
    key: 'peripherals',
    endpoint: '/Peripheral',
    label: 'Périphérique',
    icon: Usb,
    itemType: 'Peripheral'
  },
  {
    key: 'passiveEquipment',
    endpoint: '/PassiveDCEquipment',
    label: 'Matériel passif',
    icon: Layers,
    itemType: 'PassiveDCEquipment'
  },
  {
    key: 'cartridges',
    endpoint: '/CartridgeItem',
    label: 'Cartouche',
    icon: Droplet,
    itemType: 'CartridgeItem'
  },
  {
    key: 'consumables',
    endpoint: '/ConsumableItem',
    label: 'Consommable',
    icon: Package,
    itemType: 'ConsumableItem'
  },
  {
    key: 'cables',
    endpoint: '/Cable',
    label: 'Câble',
    icon: Cable,
    itemType: 'Cable'
  },
  {
    key: 'databaseInstances',
    endpoint: '/DatabaseInstance',
    label: 'Base de données',
    icon: Database,
    itemType: 'DatabaseInstance'
  },
  {
    key: 'dcRooms',
    endpoint: '/DCRoom',
    label: 'Salle serveur',
    icon: Server,
    itemType: 'DCRoom'
  }
];

/**
 * Retourne un tableau de tous les types d'éléments
 */
export const getAllItemTypes = () => ITEM_TYPES;

/**
 * Retourne les types d'éléments courants pour les tickets
 */
export const getTicketItemTypes = () => getAllItemTypes();

/**
 * Retourne les types d'éléments pour la liste ElementsList
 */
export const getElementsListItemTypes = () => getAllItemTypes();

export default ITEM_TYPES;
