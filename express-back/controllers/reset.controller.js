const db = require('../database/db');
const { resetDatabase } = require('../database/init');
const mysql = require('mysql2/promise');

const TABLES_TO_RESET = [
  'settings_langue',
  'langue',
  'settings',
  'ticket_costs',
];

const resourceToTables = {
  TicketTask: ['glpi_tickettasks'],
  TicketValidation: ['glpi_ticketvalidations'],
  ITILFollowup: ['glpi_itilfollowups'],
  Solution: ['glpi_itilsolutions'],
  Ticket: ['glpi_tickets', 'glpi_items_tickets', 'glpi_ticketcosts'],
  TicketRecurrent: ['glpi_ticketrecurrents'],
  ProblemTask: ['glpi_problemtasks'],
  Problem: ['glpi_problems'],
  ChangeTask: ['glpi_changetasks'],
  ChangeValidation: ['glpi_changevalidations'],
  Change: ['glpi_changes'],
  NetworkPort: ['glpi_networkports'],
  IPAddress: ['glpi_ipaddresses'],
  IPNetwork: ['glpi_ipnetworks'],
  NetworkName: ['glpi_networknames'],
  SoftwareVersion: ['glpi_softwareversions'],
  SoftwareLicense: ['glpi_softwarelicenses'],
  Software: ['glpi_softwares'],
  Computer: ['glpi_computers'],
  Monitor: ['glpi_monitors'],
  Printer: ['glpi_printers'],
  Peripheral: ['glpi_peripherals'],
  NetworkEquipment: ['glpi_networkequipments'],
  Phone: ['glpi_phones'],
  Appliance: ['glpi_appliances'],
  Rack: ['glpi_racks'],
  Enclosure: ['glpi_enclosures'],
  PDU: ['glpi_pdus'],
  PassiveDCEquipment: ['glpi_passivedcequipments'],
  Cable: ['glpi_cables'],
  DCRoom: ['glpi_dcrooms'],
  VirtualMachine: ['glpi_virtualmachines'],
  Cluster: ['glpi_clusters'],
  DatabaseInstance: ['glpi_databaseinstances'],
  ContractCost: ['glpi_contractcosts'],
  Contract: ['glpi_contracts'],
  Budget: ['glpi_budgets'],
  Infocom: ['glpi_infocoms'],
  Supplier: ['glpi_suppliers'],
  Contact: ['glpi_contacts'],
  Consumable: ['glpi_consumables'],
  ConsumableItem: ['glpi_consumableitems'],
  Cartridge: ['glpi_cartridges'],
  CartridgeItem: ['glpi_cartridgeitems'],
  Document: ['glpi_documents'],
  Reservation: ['glpi_reservations'],
  ReservationItem: ['glpi_reservationitems'],
  ProjectTask: ['glpi_projecttasks'],
  Project: ['glpi_projects'],
  KnowbaseItem: ['glpi_knowbaseitems'],
  Location: ['glpi_locations'],
  User: ['glpi_users']
};

const glpiDbConfig = {
  host: process.env.GLPI_DB_HOST || 'localhost',
  user: process.env.GLPI_DB_USER || 'root',
  password: process.env.GLPI_DB_PASSWORD || '',
  database: process.env.GLPI_DB_NAME || 'glpi',
};

const getTableCount = (tableName) => {
  try {
    const row = db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get();
    return row ? row.count : 0;
  } catch (error) {
    return 0;
  }
};

const resetLocalDatabase = (req, res) => {
  try {
    const beforeCounts = TABLES_TO_RESET.map((table) => ({
      table,
      count: getTableCount(table),
    }));

    resetDatabase();

    const afterCounts = TABLES_TO_RESET.map((table) => ({
      table,
      count: getTableCount(table),
    }));

    res.json({
      message: 'Local database reset successfully',
      before: beforeCounts,
      after: afterCounts,
      resetSequences: ['langue', 'ticket_costs'],
    });
  } catch (error) {
    console.error('Error resetting local database:', error);
    res.status(500).json({ error: 'Failed to reset local database', details: error.message });
  }
};

const resetGlpiAutoIncrement = async (req, res) => {
  const { resources } = req.body;
  if (!resources || !Array.isArray(resources)) {
    return res.status(400).json({ error: 'resources array is required' });
  }

  const results = [];
  let connection;

  try {
    connection = await mysql.createConnection(glpiDbConfig);

    for (const resource of resources) {
      const tableNames = resourceToTables[resource];
      if (tableNames && Array.isArray(tableNames)) {
        for (const tableName of tableNames) {
          try {
            await connection.query(`ALTER TABLE ${tableName} AUTO_INCREMENT = 1`);
            results.push({ resource, table: tableName, status: 'success' });
          } catch (err) {
            console.error(`Failed to reset auto-increment for ${tableName}:`, err);
            results.push({ resource, table: tableName, status: 'error', error: err.message });
          }
        }
      } else {
        results.push({ resource, status: 'ignored', reason: 'No matching table found' });
      }
    }

    res.json({ message: 'Auto-increment reset process completed', results });
  } catch (error) {
    console.error('Error connecting to GLPI database:', error);
    res.status(500).json({ error: 'Failed to connect to GLPI database', details: error.message });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

module.exports = { resetLocalDatabase, resetGlpiAutoIncrement };