const db = require('./db');

const DEFAULT_SETTINGS = [
  { key: 'color_nouveau', value: '#3b82f6' },
  { key: 'color_inProgress', value: '#f59e0b' },
  { key: 'color_termine', value: '#10b981' },
  { key: 'selected_language_id', value: '1' }
];

const DEFAULT_LANGUAGES = [
  { id: 1, nom: 'Français' },
  { id: 2, nom: 'Malgache' }
];

const DEFAULT_TRANSLATIONS = [
  // id_ordre, id_langue, valeur
  // Français (id_langue = 1)
  { id_ordre: 1, id_langue: 1, valeur: 'Nouveau' },
  { id_ordre: 2, id_langue: 1, valeur: 'In progress (assigné)' },
  { id_ordre: 3, id_langue: 1, valeur: 'Terminé' },
  // Malgache (id_langue = 2)
  { id_ordre: 1, id_langue: 2, valeur: 'Vaovao' },
  { id_ordre: 2, id_langue: 2, valeur: 'Efa manao' },
  { id_ordre: 3, id_langue: 2, valeur: 'Vita' }
];

const TABLE_DEFINITIONS = {
  settings: `
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `,
  langue: `
    CREATE TABLE IF NOT EXISTS langue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL UNIQUE
    )
  `,
  settings_langue: `
    CREATE TABLE IF NOT EXISTS settings_langue (
      id_ordre INTEGER NOT NULL,
      id_langue INTEGER NOT NULL,
      valeur TEXT NOT NULL,
      PRIMARY KEY (id_ordre, id_langue),
      FOREIGN KEY (id_langue) REFERENCES langue(id) ON DELETE CASCADE
    )
  `,
  ticket_costs: `
    CREATE TABLE IF NOT EXISTS ticket_costs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_ticket INTEGER,
      type_cout TEXT,
      cout REAL NOT NULL,
      id_item INTEGER,
      id_category TEXT,
      group_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      percentage REAL,
      calculation_mode INTEGER,
      base_cost REAL
    )
  `
};

const migrateTicketCosts = () => {
  const columns = db.prepare('PRAGMA table_info(ticket_costs)').all();
  const names = new Set(columns.map(column => column.name));
  const migrations = [
    ['created_at', 'ALTER TABLE ticket_costs ADD COLUMN created_at TEXT'],
    ['percentage', 'ALTER TABLE ticket_costs ADD COLUMN percentage REAL'],
    ['calculation_mode', 'ALTER TABLE ticket_costs ADD COLUMN calculation_mode INTEGER'],
    ['base_cost', 'ALTER TABLE ticket_costs ADD COLUMN base_cost REAL'],
  ];

  for (const [name, sql] of migrations) {
    if (!names.has(name)) {
      db.exec(sql);
    }
  }

  db.exec(`
    UPDATE ticket_costs
    SET created_at = COALESCE(created_at, datetime('now'))
    WHERE created_at IS NULL
  `);
};

const dropTables = () => {
  db.exec(`
    DROP TABLE IF EXISTS settings_langue;
    DROP TABLE IF EXISTS langue;
    DROP TABLE IF EXISTS settings;
    DROP TABLE IF EXISTS ticket_costs;
    DROP TABLE IF EXISTS ticket_reopen_cost;
    DROP TABLE IF EXISTS ticket_super_cost;
  `);
};

const createTables = () => {
  db.exec(TABLE_DEFINITIONS.settings);
  db.exec(TABLE_DEFINITIONS.langue);
  db.exec(TABLE_DEFINITIONS.settings_langue);
  db.exec(TABLE_DEFINITIONS.ticket_costs);
};

const seedDefaults = () => {
  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  const insertLanguage = db.prepare('INSERT OR IGNORE INTO langue (id, nom) VALUES (?, ?)');
  const insertTranslation = db.prepare('INSERT OR REPLACE INTO settings_langue (id_ordre, id_langue, valeur) VALUES (?, ?, ?)');

  const insertSettingTransaction = db.transaction((settings) => {
    for (const setting of settings) {
      insertSetting.run(setting.key, setting.value);
    }
  });

  const insertLanguageTransaction = db.transaction((languages) => {
    for (const language of languages) {
      insertLanguage.run(language.id, language.nom);
    }
  });

  const insertTranslationTransaction = db.transaction((translations) => {
    for (const translation of translations) {
      insertTranslation.run(translation.id_ordre, translation.id_langue, translation.valeur);
    }
  });

  insertSettingTransaction(DEFAULT_SETTINGS);
  insertLanguageTransaction(DEFAULT_LANGUAGES);
  insertTranslationTransaction(DEFAULT_TRANSLATIONS);
};

const initDatabase = ({ reset = false } = {}) => {
  if (reset) {
    dropTables();
  }

  createTables();
  migrateTicketCosts();
  seedDefaults();

  console.log(reset
    ? '✅ Local database reset and re-seeded.'
    : '✅ Database initialized with default tables and seed values.');
};

const resetDatabase = () => initDatabase({ reset: true });

module.exports = {
  initDatabase,
  resetDatabase,
  DEFAULT_SETTINGS,
  DEFAULT_LANGUAGES,
  DEFAULT_TRANSLATIONS,
};
