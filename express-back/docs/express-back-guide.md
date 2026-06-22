# 📦 Guide Express-Back + SQLite

> Stack : **Node.js + Express + better-sqlite3**
> Projet : `D:\xampp\htdocs\glpi\express-back`

---

## 📁 Structure du projet

```
express-back/
├── .env
├── package.json
├── server.js
├── database/
│   ├── db.js          ← Connexion SQLite
│   ├── init.js        ← Création des tables
│   ├── seed.js        ← Insertion de données de test
│   ├── reset.js       ← Suppression + recréation des tables
│   └── glpi.db        ← Fichier base de données (auto-créé)
├── routes/
│   ├── index.js
│   └── items.routes.js
└── controllers/
    └── items.controller.js
```

---

## ⚙️ Configuration

### `.env`

```
PORT=3001
DB_PATH=./database/glpi.db
```

### `database/db.js`

```js
const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const db = new Database(path.resolve(process.env.DB_PATH));
db.pragma('journal_mode = WAL');

console.log('✅ SQLite connecté');
module.exports = db;
```

> `better-sqlite3` crée automatiquement le fichier `glpi.db` s'il n'existe pas.

---


## 🗄️ Gestion de la base SQLite

### Créer les tables — `database/init.js`

```js
const db = require('./db');

db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    nom         TEXT NOT NULL,
    description TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log('✅ Table items créée');
```

```powershell
node database/init.js
```

---

### Insérer des données de test — `database/seed.js`

```js
const db = require('./db');

const items = [
  { nom: 'Ordinateur portable', description: 'Dell Latitude 5520' },
  { nom: 'Souris',              description: 'Logitech MX Master 3' },
  { nom: 'Clavier',             description: 'Mécanique Cherry MX' },
  { nom: 'Écran',               description: 'Samsung 27 pouces 4K' },
  { nom: 'Imprimante',          description: 'HP LaserJet Pro' },
];

const insert = db.prepare('INSERT INTO items (nom, description) VALUES (?, ?)');

const insertMany = db.transaction((items) => {
  for (const item of items) {
    insert.run(item.nom, item.description);
  }
});

insertMany(items);
console.log(`✅ ${items.length} items insérés`);
```

```powershell
node database/seed.js
```

---

### Réinitialiser la base — `database/reset.js`

```js
const db = require('./db');

db.exec(`DROP TABLE IF EXISTS items;`);
console.log('🗑️  Tables supprimées');

db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    nom         TEXT NOT NULL,
    description TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
console.log('✅ Tables recréées');
```

```powershell
node database/reset.js
```

---

### Reset total (supprimer les fichiers DB)

```powershell
# 1. Arrêter nodemon (Ctrl+C)
# 2. Supprimer les fichiers
Remove-Item database\glpi.db, database\glpi.db-shm, database\glpi.db-wal
# 3. Recréer
node database/init.js
# 4. Relancer
npm run dev
```

> ⚠️ Supprimer les 3 fichiers ensemble — ne jamais supprimer `glpi.db` seul.

---

### Fichiers WAL (normaux, ne pas supprimer)

| Fichier         | Rôle                                         |
| --------------- | --------------------------------------------- |
| `glpi.db`     | Base principale                               |
| `glpi.db-wal` | Écritures en attente (Write-Ahead Log)       |
| `glpi.db-shm` | Coordination entre connexions (Shared Memory) |

---

## 🔍 Requêtes SQL SQLite

### SELECT

```sql
-- Tous les enregistrements
SELECT * FROM items;

-- Avec filtre
SELECT * FROM items WHERE id = 1;

-- Colonnes spécifiques
SELECT id, nom FROM items;

-- Tri
SELECT * FROM items ORDER BY created_at DESC;

-- Limite
SELECT * FROM items LIMIT 10;

-- Recherche texte
SELECT * FROM items WHERE nom LIKE '%clavier%';
```

### INSERT

```sql
INSERT INTO items (nom, description)
VALUES ('Webcam', 'Logitech C920');
```

### UPDATE

```sql
UPDATE items
SET nom = 'Webcam HD', description = 'Logitech C920 Pro'
WHERE id = 1;
```

### DELETE

```sql
-- Supprimer un enregistrement
DELETE FROM items WHERE id = 1;

-- Vider la table (sans supprimer la structure)
DELETE FROM items;

-- Vider + réinitialiser l'autoincrement
DELETE FROM items;
DELETE FROM sqlite_sequence WHERE name = 'items';
```

### Vérifier les tables existantes

```sql
SELECT name FROM sqlite_master WHERE type = 'table';
```

### Voir la structure d'une table

```sql
PRAGMA table_info(items);
```

---

## 🔄 Utilisation dans Express (better-sqlite3)

```js
const db = require('../database/db');

// SELECT tous
const rows = db.prepare('SELECT * FROM items').all();

// SELECT un
const row = db.prepare('SELECT * FROM items WHERE id = ?').get(id);

// INSERT
const result = db.prepare('INSERT INTO items (nom, description) VALUES (?, ?)').run(nom, description);
console.log(result.lastInsertRowid); // ID du nouvel enregistrement

// UPDATE
db.prepare('UPDATE items SET nom = ? WHERE id = ?').run(nom, id);

// DELETE
db.prepare('DELETE FROM items WHERE id = ?').run(id);
```

---

## 🚀 Commandes utiles

| Commande                   | Description                      |
| -------------------------- | -------------------------------- |
| `npm run dev`            | Lancer le serveur avec nodemon   |
| `npm start`              | Lancer le serveur sans nodemon   |
| `node database/init.js`  | Créer les tables                |
| `node database/seed.js`  | Insérer des données de test    |
| `node database/reset.js` | Supprimer et recréer les tables |

---

## 🧪 Tester l'API

```
GET    http://localhost:3001/ping          → Test serveur
GET    http://localhost:3001/api/items     → Liste tous les items
GET    http://localhost:3001/api/items/1   → Un item par ID
POST   http://localhost:3001/api/items     → Créer un item
PUT    http://localhost:3001/api/items/1   → Modifier un item
DELETE http://localhost:3001/api/items/1   → Supprimer un item
```

---

## 🔗 Proxy Vite (react-app)

Dans `vite.config.js` du front React :

```js
proxy: {
  '/glpi': 'http://localhost/glpi',   // GLPI existant
  '/api':  'http://localhost:3001',   // Express backend
}
```

Appel depuis React :

```js
axios.get('/api/items') // Vite redirige vers Express
```

---

## 📊 Visualiser la base

Télécharger **DB Browser for SQLite** : https://sqlitebrowser.org/dl/

Ouvrir le fichier : `D:\xampp\htdocs\glpi\express-back\database\glpi.db`

> ⚠️ Arrêter nodemon avant d'écrire depuis DB Browser (conflit de connexion).
