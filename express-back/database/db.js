const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const db = new Database(path.resolve(process.env.DB_PATH));

// Active le mode WAL pour de meilleures performances
db.pragma('journal_mode = WAL');

console.log('✅ SQLite connecté');

module.exports = db;