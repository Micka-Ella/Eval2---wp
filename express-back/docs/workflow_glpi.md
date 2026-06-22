# Implémentation de l'annulation et du plafond de réouverture

J'ai commencé par regarder comment marchent les tables de notre base SQLite. J'ajoute le champ pour l'annulation et la nouvelle option pour le plafond.

📍 express-back/database/init.js → MODIFIER → remplacer le tableau DEFAULT_SETTINGS et la table ticket_costs
```javascript
// ... code existant ...
const DEFAULT_SETTINGS = [
  { key: 'color_nouveau', value: '#3b82f6' },
  { key: 'color_inProgress', value: '#f59e0b' },
  { key: 'color_termine', value: '#10b981' },
  { key: 'selected_language_id', value: '1' },
  { key: 'plafond', value: '50' }
];

const DEFAULT_LANGUAGES = [
// ... code existant ...
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
      base_cost REAL,
      is_cancelled INTEGER DEFAULT 0
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
    ['is_cancelled', 'ALTER TABLE ticket_costs ADD COLUMN is_cancelled INTEGER DEFAULT 0'],
  ];
// ... code existant ...
```

Voici le log quand j'ai lancé l'initialisation de la base de données.

```bash
$ node -e "require('./express-back/database/init').initDatabase()"
✅ Database initialized with default tables and seed values.
$ sqlite3 database.sqlite "PRAGMA table_info(ticket_costs);"
0|id|INTEGER|0||1
1|id_ticket|INTEGER|0||0
2|type_cout|TEXT|0||0
3|cout|REAL|1||0
4|id_item|INTEGER|0||0
5|id_category|TEXT|0||0
6|group_id|TEXT|0||0
7|created_at|TEXT|0|CURRENT_TIMESTAMP|0
8|percentage|REAL|0||0
9|calculation_mode|INTEGER|0||0
10|base_cost|REAL|0||0
11|is_cancelled|INTEGER|0|0|0
```

J'ajoute la route de rétablissement dans les routes du back-end.

📍 express-back/routes/ticketCost.routes.js → AJOUTER → après `router.put('/operations/:operationKey', ticketCostController.updateCostOperation);`
```javascript
// ... code existant ...
router.post('/', ticketCostController.saveSuperCost);
router.get('/', ticketCostController.getAllSuperCosts);
router.get('/operations/all', ticketCostController.getCostOperations);
router.put('/operations/:operationKey', ticketCostController.updateCostOperation);
router.put('/operations/:operationKey/restore', ticketCostController.restoreCostOperation);
router.get('/:ticket_id', ticketCostController.getSuperCost);
// ... code existant ...
```

Je mets à jour le controller pour intégrer l'annulation et le calcul avec le plafond.

📍 express-back/controllers/TicketCostController.js → MODIFIER → remplacer les fonctions de sélection, d'annulation, de réouverture et ajouter le rétablissement
```javascript
// ... code existant ...
const operationKeySql = "COALESCE(group_id, 'row-' || id)";

const getPlafondValue = () => {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'plafond'").get();
  return row ? parseFloat(row.value) : 50.0;
};

const getOperationRows = (operationKey, type, ticketId) => db.prepare(`
  SELECT *
  FROM ticket_costs
  WHERE ${operationKeySql} = ? AND type_cout = ? AND id_ticket = ?
  ORDER BY id
`).all(operationKey, type, ticketId);
// ... code existant ...
const getSuperOperationsBefore = (ticketId, beforeId) => db.prepare(`
  SELECT
    ${operationKeySql} AS operation_key,
    MIN(id) AS first_id,
    SUM(cout) AS total
  FROM ticket_costs
  WHERE id_ticket = ? AND type_cout = 'super_cost' AND id < ? AND (is_cancelled IS NULL OR is_cancelled = 0)
  GROUP BY ${operationKeySql}
  ORDER BY first_id
`).all(ticketId, beforeId);
// ... code existant ...
const hydrateLegacyReopenMetadata = (ticketId = null) => {
  const params = ticketId === null ? [] : [ticketId];
  const ticketFilter = ticketId === null ? '' : 'AND id_ticket = ?';
  const operations = db.prepare(`
    SELECT
      ${operationKeySql} AS operation_key,
      id_ticket,
      MIN(id) AS first_id,
      SUM(cout) AS total,
      MAX(percentage) AS percentage,
      MAX(calculation_mode) AS calculation_mode
    FROM ticket_costs
    WHERE type_cout = 'reopen_cost' ${ticketFilter}
    GROUP BY ${operationKeySql}, id_ticket
    ORDER BY first_id
  `).all(...params);

  const update = db.prepare(`
    UPDATE ticket_costs
    SET percentage = ?, calculation_mode = ?, base_cost = ?
    WHERE ${operationKeySql} = ? AND type_cout = 'reopen_cost' AND id_ticket = ?
  `);

  for (const operation of operations) {
    if (operation.percentage !== null && operation.calculation_mode !== null) continue;
    const mode = Number(operation.calculation_mode || 1);
    const base = calculateBaseFromOperations(
      getSuperOperationsBefore(operation.id_ticket, operation.first_id),
      mode
    );
    const percentage = base > 0 ? Number(operation.total || 0) / base * 100 : 0;
    update.run(percentage, mode, base, operation.operation_key, operation.id_ticket);
  }
};

const recalculateReopensAfter = (ticketId, afterId) => {
  hydrateLegacyReopenMetadata(ticketId);
  const reopenOperations = db.prepare(`
    SELECT
      ${operationKeySql} AS operation_key,
      MIN(id) AS first_id,
      MAX(percentage) AS percentage,
      MAX(calculation_mode) AS calculation_mode
    FROM ticket_costs
    WHERE id_ticket = ? AND type_cout = 'reopen_cost' AND id > ?
    GROUP BY ${operationKeySql}
    ORDER BY first_id
  `).all(ticketId, afterId);

  for (const operation of reopenOperations) {
    const mode = Number(operation.calculation_mode || 1);
    const percentage = Number(operation.percentage || 0);
    const base = calculateBaseFromOperations(
      getSuperOperationsBefore(ticketId, operation.first_id),
      mode
    );
    const rows = getOperationRows(operation.operation_key, 'reopen_cost', ticketId);
    
    let finalReopenTotal = base * percentage / 100;
    const valeurPlafond = getPlafondValue();
    const sumSuperRow = db.prepare("SELECT SUM(cout) AS total FROM ticket_costs WHERE id_ticket = ? AND type_cout = 'super_cost' AND (is_cancelled IS NULL OR is_cancelled = 0)").get(ticketId);
    const sumSuper = sumSuperRow ? sumSuperRow.total || 0 : 0;
    const calculLimite = sumSuper * (valeurPlafond / 100);
    if (finalReopenTotal > calculLimite) {
      finalReopenTotal = calculLimite;
    }
    
    updateGroupTotal(rows, finalReopenTotal, { percentage, mode, baseCost: base });
  }
};

const getGroupedCostOperations = () => db.prepare(`
  SELECT
    ${operationKeySql} AS operation_key,
    group_id,
    id_ticket AS ticket_id,
    type_cout,
    MIN(id) AS first_id,
    MIN(created_at) AS created_at,
    SUM(cout) AS total_cost,
    MAX(percentage) AS percentage,
    MAX(calculation_mode) AS mode,
    MAX(base_cost) AS base_cost,
    COUNT(*) AS batch_size,
    MAX(is_cancelled) AS is_cancelled
  FROM ticket_costs
  WHERE type_cout IN ('super_cost', 'reopen_cost')
  GROUP BY ${operationKeySql}, group_id, id_ticket, type_cout
  ORDER BY first_id
`).all();

const buildCostHistory = (operations) => {
  const history = [];
  const currentSuperByTicket = new Map();

  for (const operation of operations) {
    const ticketId = Number(operation.ticket_id);

    if (operation.type_cout === 'super_cost') {
      const row = {
        history_key: `super:${ticketId}:${operation.operation_key}`,
        ticket_id: ticketId,
        first_id: operation.first_id,
        created_at: operation.created_at,
        super_operation_key: operation.operation_key,
        super_cost: Number(operation.total_cost || 0),
        super_batch_size: operation.batch_size,
        reopen_operation_key: null,
        reopen_cost: null,
        percentage: null,
        mode: null,
        base_cost: null,
        reopen_created_at: null,
        reopen_batch_size: 0,
        is_cancelled: operation.is_cancelled || 0,
      };
      history.push(row);
      currentSuperByTicket.set(ticketId, row);
      continue;
    }

    const currentSuper = currentSuperByTicket.get(ticketId);
    const reopenValues = {
      reopen_operation_key: operation.operation_key,
      reopen_cost: Number(operation.total_cost || 0),
      percentage: Number(operation.percentage || 0),
      mode: Number(operation.mode || 1),
      base_cost: Number(operation.base_cost || 0),
      reopen_created_at: operation.created_at,
      reopen_batch_size: operation.batch_size,
      is_cancelled: operation.is_cancelled || 0,
    };

    if (currentSuper && !currentSuper.reopen_operation_key) {
      Object.assign(currentSuper, reopenValues);
      currentSuper.history_key += `:reopen:${operation.operation_key}`;
    } else {
      history.push({
        history_key: `reopen:${ticketId}:${operation.operation_key}`,
        ticket_id: ticketId,
        first_id: operation.first_id,
        created_at: operation.created_at,
        super_operation_key: currentSuper?.super_operation_key || null,
        super_cost: currentSuper?.super_cost ?? null,
        super_batch_size: currentSuper?.super_batch_size || 0,
        is_cancelled: operation.is_cancelled || 0,
        ...reopenValues,
      });
    }
  }

  return history.sort((a, b) => a.first_id - b.first_id);
};
// ... code existant ...
exports.getAllSuperCosts = (req, res) => {
  try {
    const stmt = db.prepare("SELECT id_ticket as ticket_id, cout as super_cost FROM ticket_costs WHERE type_cout = ? AND (is_cancelled IS NULL OR is_cancelled = 0)");
    const results = stmt.all('super_cost');
    res.status(200).json(results);
  } catch (error) {
    console.error('Error getting all super costs:', error);
    res.status(500).json({ error: 'Failed to get super costs' });
  }
};

exports.getSuperCost = (req, res) => {
  const { ticket_id } = req.params;

  try {
    const stmt = db.prepare("SELECT SUM(cout) as total_super_cost FROM ticket_costs WHERE id_ticket = ? AND type_cout = ? AND (is_cancelled IS NULL OR is_cancelled = 0)");
    const result = stmt.get(ticket_id, 'super_cost');
    
    if (result && result.total_super_cost !== null) {
      res.status(200).json({ super_cost: result.total_super_cost });
    } else {
      res.status(404).json({ error: 'Super cost not found for this ticket' });
    }
  } catch (error) {
    console.error('Error getting super cost:', error);
    res.status(500).json({ error: 'Failed to get super cost' });
  }
};

exports.deleteSuperCost = (req, res) => {
  const { ticket_id } = req.params;
  try {
    const lastStmt = db.prepare("SELECT id, group_id FROM ticket_costs WHERE id_ticket = ? AND type_cout = ? AND (is_cancelled IS NULL OR is_cancelled = 0) ORDER BY id DESC LIMIT 1");
    const lastRow = lastStmt.get(ticket_id, 'super_cost');
    
    if (lastRow) {
      if (lastRow.group_id) {
        const deleteStmt = db.prepare("UPDATE ticket_costs SET is_cancelled = 1 WHERE group_id = ? AND id_ticket = ? AND type_cout = ?");
        deleteStmt.run(lastRow.group_id, ticket_id, 'super_cost');
      } else {
        const deleteStmt = db.prepare("UPDATE ticket_costs SET is_cancelled = 1 WHERE id = ?");
        deleteStmt.run(lastRow.id);
      }
      recalculateReopensAfter(ticket_id, lastRow.id - 1);
    }
    res.status(200).json({ message: 'Deleted last super cost' });
  } catch (error) {
    res.status(500).json({ error: 'Error' });
  }
};

exports.saveReopenCost = (req, res) => {
  const { ticket_id, percentage, id_item, id_category, group_id } = req.body;
  try {
    const lastRow = db.prepare(`
      SELECT id, ${operationKeySql} AS operation_key
      FROM ticket_costs
      WHERE id_ticket = ? AND type_cout = 'super_cost' AND (is_cancelled IS NULL OR is_cancelled = 0)
      ORDER BY id DESC LIMIT 1
    `).get(ticket_id);
    if (lastRow) {
      const baseCost = db.prepare(`
        SELECT SUM(cout) AS total
        FROM ticket_costs
        WHERE ${operationKeySql} = ? AND id_ticket = ? AND type_cout = 'super_cost' AND (is_cancelled IS NULL OR is_cancelled = 0)
      `).get(lastRow.operation_key, ticket_id).total || 0;
      
      let reopen_cost = baseCost * (percentage / 100);
      const valeurPlafond = getPlafondValue();
      const sumSuperRow = db.prepare("SELECT SUM(cout) AS total FROM ticket_costs WHERE id_ticket = ? AND type_cout = 'super_cost' AND (is_cancelled IS NULL OR is_cancelled = 0)").get(ticket_id);
      const sumSuper = sumSuperRow ? sumSuperRow.total || 0 : 0;
      const calculLimite = sumSuper * (valeurPlafond / 100);
      if (reopen_cost > calculLimite) {
        reopen_cost = calculLimite;
      }
      
      const insertStmt = db.prepare(`
        INSERT INTO ticket_costs (
          id_ticket, type_cout, cout, id_item, id_category, group_id,
          created_at, percentage, calculation_mode, base_cost, is_cancelled
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, 1, ?, 0)
      `);
      insertStmt.run(
        ticket_id,
        'reopen_cost',
        reopen_cost,
        id_item || null,
        id_category || null,
        group_id || null,
        percentage,
        baseCost
      );
      res.status(200).json({ reopen_cost });
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error' });
  }
};

exports.getAllReopenCosts = (req, res) => {
  try {
    const stmt = db.prepare("SELECT id_ticket as ticket_id, cout as reopen_cost FROM ticket_costs WHERE type_cout = ? AND (is_cancelled IS NULL OR is_cancelled = 0)");
    const results = stmt.all('reopen_cost');
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load ' });
  }
};

exports.calculateBaseCost = (req, res) => {
  const { ticket_id, mode } = req.params;
  const modeInt = parseInt(mode, 10);
  
  try {
    let base_cost = 0;
    
    if (modeInt === 1) {
      const lastRow = db.prepare("SELECT group_id, cout FROM ticket_costs WHERE id_ticket = ? AND type_cout = 'super_cost' AND (is_cancelled IS NULL OR is_cancelled = 0) ORDER BY id DESC LIMIT 1").get(ticket_id);
      if (lastRow) {
        if (lastRow.group_id) {
          base_cost = db.prepare("SELECT SUM(cout) as total FROM ticket_costs WHERE group_id = ? AND id_ticket = ? AND type_cout = 'super_cost' AND (is_cancelled IS NULL OR is_cancelled = 0)").get(lastRow.group_id, ticket_id).total;
        } else {
          base_cost = lastRow.cout;
        }
      }
    } else if (modeInt === 2) {
      const firstRow = db.prepare("SELECT group_id, cout FROM ticket_costs WHERE id_ticket = ? AND type_cout = 'super_cost' AND (is_cancelled IS NULL OR is_cancelled = 0) ORDER BY id ASC LIMIT 1").get(ticket_id);
      if (firstRow) {
        if (firstRow.group_id) {
          base_cost = db.prepare("SELECT SUM(cout) as total FROM ticket_costs WHERE group_id = ? AND id_ticket = ? AND type_cout = 'super_cost' AND (is_cancelled IS NULL OR is_cancelled = 0)").get(firstRow.group_id, ticket_id).total;
        } else {
          base_cost = firstRow.cout;
        }
      }
    } else if (modeInt === 3) {
      const allRows = db.prepare("SELECT id, group_id, cout FROM ticket_costs WHERE id_ticket = ? AND type_cout = 'super_cost' AND (is_cancelled IS NULL OR is_cancelled = 0)").all(ticket_id);
      let totalSum = 0;
      let groups = new Set();
      let nullGroupCount = 0;
      for (const row of allRows) {
        totalSum += row.cout;
        if (row.group_id) {
          groups.add(row.group_id);
        } else {
          nullGroupCount++;
        }
      }
      const count = groups.size + nullGroupCount;
      base_cost = count > 0 ? totalSum / count : 0;
    } else if (modeInt === 4) {
      const sumRow = db.prepare("SELECT SUM(cout) as total FROM ticket_costs WHERE id_ticket = ? AND type_cout = 'super_cost' AND (is_cancelled IS NULL OR is_cancelled = 0)").get(ticket_id);
      base_cost = sumRow ? sumRow.total || 0 : 0;
    } else {
      return res.status(400).json({ error: 'Invalid mode' });
    }
    
    res.status(200).json({ base_cost });
  } catch (error) {
    console.error('Error calculating base cost:', error);
    res.status(500).json({ error: 'Failed to calculate base cost' });
  }
};
// ... code existant ...
exports.updateCostOperation = (req, res) => {
  const { operationKey } = req.params;
  const { value, percentage, mode, ticket_id, type_cout } = req.body;
  const parsedValue = Number(value);
  const parsedPercentage = Number(percentage);
  const parsedMode = Number(mode);

  try {
    const result = db.transaction(() => {
      const operation = db.prepare(`
        SELECT id_ticket, type_cout, MIN(id) AS first_id
        FROM ticket_costs
        WHERE ${operationKeySql} = ? AND id_ticket = ? AND type_cout = ?
        GROUP BY id_ticket, type_cout
      `).get(operationKey, ticket_id, type_cout);

      if (!operation) {
        const error = new Error('Operation not found');
        error.statusCode = 404;
        throw error;
      }

      const rows = getOperationRows(operationKey, operation.type_cout, operation.id_ticket);
      if (operation.type_cout === 'super_cost') {
        if (!Number.isFinite(parsedValue) || parsedValue < 0) {
          const error = new Error('Invalid super cost value');
          error.statusCode = 400;
          throw error;
        }
        updateGroupTotal(rows, parsedValue);
        recalculateReopensAfter(operation.id_ticket, operation.first_id);
      } else {
        if (!Number.isFinite(parsedPercentage) || parsedPercentage < 0 || ![1, 2, 3, 4].includes(parsedMode)) {
          const error = new Error('Invalid reopen percentage or mode');
          error.statusCode = 400;
          throw error;
        }
        const base = calculateBaseFromOperations(
          getSuperOperationsBefore(operation.id_ticket, operation.first_id),
          parsedMode
        );
        let finalReopenTotal = base * parsedPercentage / 100;
        const valeurPlafond = getPlafondValue();
        const sumSuperRow = db.prepare("SELECT SUM(cout) AS total FROM ticket_costs WHERE id_ticket = ? AND type_cout = 'super_cost' AND (is_cancelled IS NULL OR is_cancelled = 0)").get(operation.id_ticket);
        const sumSuper = sumSuperRow ? sumSuperRow.total || 0 : 0;
        const calculLimite = sumSuper * (valeurPlafond / 100);
        if (finalReopenTotal > calculLimite) {
          finalReopenTotal = calculLimite;
        }
        updateGroupTotal(rows, finalReopenTotal, {
          percentage: parsedPercentage,
          mode: parsedMode,
          baseCost: base,
        });
      }

      return { ticketId: operation.id_ticket, type: operation.type_cout };
    })();

    res.json({ message: 'Cost operation updated', ...result });
  } catch (error) {
    console.error('Error updating cost operation:', error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.restoreCostOperation = (req, res) => {
  const { operationKey } = req.params;
  const { ticket_id, type_cout } = req.body;
  // const oldStatus = 0; // pour test
  // console.log("operation_key active:", operationKey);

  try {
    db.transaction(() => {
      if (operationKey.startsWith('row-')) {
        const id = operationKey.split('-')[1];
        db.prepare("UPDATE ticket_costs SET is_cancelled = 0 WHERE id = ?").run(id);
      } else {
        db.prepare("UPDATE ticket_costs SET is_cancelled = 0 WHERE group_id = ? AND id_ticket = ? AND type_cout = ?").run(operationKey, ticket_id, type_cout);
      }
    })();

    const operation = db.prepare(`
      SELECT MIN(id) AS first_id
      FROM ticket_costs
      WHERE ${operationKeySql} = ? AND id_ticket = ? AND type_cout = ?
    `).get(operationKey, ticket_id, type_cout);

    if (operation && operation.first_id) {
      recalculateReopensAfter(ticket_id, operation.first_id - 1);
    }

    res.json({ message: 'Cost operation restored' });
  } catch (error) {
    console.error('Error restoring cost operation:', error);
    res.status(500).json({ error: error.message });
  }
};
```

Voici le log pour tester le rétablissement d'une opération annulée.

```bash
$ curl -X PUT http://localhost:3001/api/ticket-cost/operations/row-1/restore -H "Content-Type: application/json" -d "{\"ticket_id\":1,\"type_cout\":\"super_cost\"}"
{"message":"Cost operation restored"}
```

J'ajoute la fonction de rétablissement dans le service d'appel API.

📍 react-app/src/services/TicketCost/TicketCostService.js → AJOUTER → après `updateCostOperation`
```javascript
// ... code existant ...
  updateCostOperation: async (operationKey, payload) => {
    const response = await axios.put(
      `${TICKETCOST_API_URL}/operations/${encodeURIComponent(operationKey)}`,
      payload
    );
    return response.data;
  },

  restoreCostOperation: async (operationKey, payload) => {
    const response = await axios.put(
      `${TICKETCOST_API_URL}/operations/${encodeURIComponent(operationKey)}/restore`,
      payload
    );
    return response.data;
  }
};

export default TicketCostService;
```

Dans la configuration du Kanban, je rajoute un input pour définir la valeur du plafond de réouverture.

📍 react-app/src/pages/backoffice/AdminSettings/AdminSettings.jsx → MODIFIER → ajouter l'état plafond, le charger, le sauvegarder et afficher le champ
```javascript
// ... code existant ...
const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [plafond, setPlafond] = useState('50');
  
  const [colors, setColors] = useState({
// ... code existant ...
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const data = await SettingsService.getSettings();
        setColors({
          color_nouveau: data.color_nouveau || '#3b82f6',
          color_inProgress: data.color_inProgress || '#f59e0b',
          color_termine: data.color_termine || '#10b981'
        });
        setSelectedLanguageId(parseInt(data.selected_language_id) || 1);
        setPlafond(data.plafond || '50');
        if (data.languages) {
          setLanguages(data.languages);
        }
// ... code existant ...
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      const payload = {
        color_nouveau: colors.color_nouveau,
        color_inProgress: colors.color_inProgress,
        color_termine: colors.color_termine,
        selected_language_id: String(selectedLanguageId),
        all_translations: translations,
        plafond: plafond
      };

      await SettingsService.updateSettings(payload);
// ... code existant ...
            {/* Section III: Translations */}
            <div className="admin-section" style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginBottom: '20px' }}>
                iii. Libellés des statuts (pour la langue sélectionnée)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Libellé "Nouveau"</label>
                  <input
                    type="text"
                    value={translations[selectedLanguageId]?.label_nouveau || ''}
                    onChange={e => handleLabelChange('label_nouveau', e.target.value)}
                    placeholder="Ex: Vaovao"
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Libellé "In progress"</label>
                  <input
                    type="text"
                    value={translations[selectedLanguageId]?.label_inProgress || ''}
                    onChange={e => handleLabelChange('label_inProgress', e.target.value)}
                    placeholder="Ex: Efa manao"
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Libellé "Terminé"</label>
                  <input
                    type="text"
                    value={translations[selectedLanguageId]?.label_termine || ''}
                    onChange={e => handleLabelChange('label_termine', e.target.value)}
                    placeholder="Ex: Vita"
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section IV: Plafond */}
            <div className="admin-section" style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginBottom: '20px' }}>
                iv. Paramètre de calcul
              </h3>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '300px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>Plafond de réouverture (%)</label>
                <input
                  type="number"
                  value={plafond}
                  onChange={e => setPlafond(e.target.value)}
                  placeholder="Ex: 50"
                  min="0"
                  max="100"
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
// ... code existant ...
```

Dans l'historique, je trie les lignes pour mettre les annulées tout en bas et j'affiche le bouton Rétablir.

📍 react-app/src/pages/backoffice/CostOperations.jsx → MODIFIER → trier les opérations, griser les annulées et ajouter le bouton rétablir
```javascript
// ... code existant ...
const CostOperations = () => {
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ superCost: '', percentage: '', mode: 1 });

  const loadOperations = async () => {
    try {
      setLoading(true);
      setOperations(await TicketCostService.getCostOperations());
    } catch (error) {
      toast.error(error.response?.data?.error || 'Impossible de charger les coûts.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetablirCost = async (operation) => {
    // const tempVal = operation.ticket_id; // debug
    // console.log("retablir:", operation);
    try {
      setSaving(true);
      await TicketCostService.restoreCostOperation(
        operation.super_operation_key || operation.reopen_operation_key,
        {
          ticket_id: operation.ticket_id,
          type_cout: operation.super_operation_key ? 'super_cost' : 'reopen_cost'
        }
      );
      await loadOperations();
    } catch (error) {
      console.error("erreur de rétablissement:", error);
    } finally {
      setSaving(false);
    }
  };

  const sortedOperations = useMemo(() => {
    const activeOperations = operations.filter(op => !op.is_cancelled);
    const annuleesOperations = operations.filter(op => op.is_cancelled);
    return [...activeOperations, ...annuleesOperations];
  }, [operations]);

  const totals = useMemo(() => {
    const superCosts = new Map();
    const reopenCosts = new Map();

    operations.forEach(operation => {
      if (operation.is_cancelled) return;
      if (operation.super_operation_key) {
        superCosts.set(operation.super_operation_key, Number(operation.super_cost || 0));
      }
      if (operation.reopen_operation_key) {
        reopenCosts.set(operation.reopen_operation_key, Number(operation.reopen_cost || 0));
      }
    });
// ... code existant ...
      <div className="cost-operations-card">
        {loading ? (
          <div className="cost-operations-state">Chargement de l'historique…</div>
        ) : sortedOperations.length === 0 ? (
          <div className="cost-operations-state">Aucun historique enregistré.</div>
        ) : (
          <div className="cost-operations-table-wrap">
            <table className="cost-operations-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Ticket ID</th>
                  <th>Coût original</th>
                  <th>% Réouverture</th>
                  <th>Coût réouverture</th>
                  <th>Mode</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedOperations.map(operation => (
                  <tr key={operation.history_key} style={operation.is_cancelled ? { opacity: 0.5, textDecoration: 'line-through' } : {}}>
                    <td>{formatDate(operation.created_at)} {operation.is_cancelled ? "(Annulé)" : ""}</td>
                    <td><strong>#{operation.ticket_id}</strong></td>
                    <td className="operation-amount">
                      {operation.super_cost === null ? '—' : formatAmount(operation.super_cost)}
                    </td>
                    <td>{operation.reopen_operation_key ? formatAmount(operation.percentage) : '—'}</td>
                    <td className="operation-amount">
                      {operation.reopen_operation_key ? formatAmount(operation.reopen_cost) : '—'}
                    </td>
                    <td>
                      {operation.reopen_operation_key
                        ? `Mode ${operation.mode} (${MODES[operation.mode] || 'Mode inconnu'})`
                        : '—'}
                    </td>
                    <td className="operation-actions">
                      {operation.is_cancelled ? (
                        <button type="button" onClick={() => handleRetablirCost(operation)} disabled={saving}>
                          Rétablir
                        </button>
                      ) : (
                        <button type="button" onClick={() => openEditModal(operation)}>
                          <Edit3 size={15} />
                          Mettre à jour & recalculer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
// ... code existant ...
```

Voici les logs du chargement des opérations après l'ajout du tri.

```bash
$ curl http://localhost:3001/api/ticket-cost/operations/all
[{"history_key":"super:1:row-1","ticket_id":1,"first_id":1,"created_at":"2026-06-22 13:20:00","super_operation_key":"row-1","super_cost":100,"super_batch_size":1,"reopen_operation_key":null,"reopen_cost":null,"percentage":null,"mode":null,"base_cost":null,"reopen_created_at":null,"reopen_batch_size":0,"is_cancelled":1}]
```

Dans le Kanban, je calcule le plafond pour brider le coût calculé lors de la réouverture.

📍 react-app/src/pages/frontoffice/TicketKanban.jsx → MODIFIER → modifier la fonction de réouverture
```javascript
// ... code existant ...
  const handleReopenTicket = async (ticketId, percentage, mode, targetColumnId) => {
    try {
      setLoading(true);
      if (percentage) {
        const modeInt = mode || 1;
        let baseCost = 0;
        try {
           const res = await TicketCostService.calculateBaseCost(ticketId, modeInt);
           baseCost = res.base_cost || 0;
        } catch(err) {
           console.error("Error calculating base cost for ticket", ticketId, err);
        }
        
        let calculatedCost = baseCost * (parseFloat(percentage) / 100);
        // const temporaireVal = calculatedCost; // a verifier
        // console.log("calcul limite:", calculLimite);

        let valeurPlafond = 50.0;
        try {
          const settings = await SettingsService.getSettings();
          valeurPlafond = parseFloat(settings.plafond || 50.0);
        } catch (err) {
          console.warn("Erreur chargement plafond:", err);
        }

        let sommeSuperCost = 0;
        try {
          const superCostRes = await TicketCostService.getSuperCost(ticketId);
          sommeSuperCost = superCostRes.super_cost || 0;
        } catch (err) {
          console.warn("Erreur chargement super cost:", err);
        }

        const calculLimite = sommeSuperCost * (valeurPlafond / 100);
        if (calculatedCost > calculLimite) {
          calculatedCost = calculLimite;
        }

        const linkedItems = await ItemTicketService.getItemsForTicket(ticketId);
        const groupId = Date.now().toString() + Math.random().toString(36).substr(2, 5);

        if (linkedItems && linkedItems.length > 0) {
          const dividedCost = calculatedCost / linkedItems.length;
          for (const item of linkedItems) {
            await TicketCostService.saveCustomReopenCost(
              ticketId, dividedCost, item.items_id, item.itemtype, groupId,
              parseFloat(percentage), modeInt, baseCost
            );
          }
        } else {
          await TicketCostService.saveCustomReopenCost(
            ticketId, calculatedCost, null, null, groupId,
            parseFloat(percentage), modeInt, baseCost
          );
        }
      }
      setReopenModalData(prev => ({ ...prev, isOpen: false }));
      if (targetColumnId === 'inProgress') {
        await TicketService.updateTicket(ticketId, { status: 2 });
        await fetchTickets();
        setAssignModalData({ isOpen: true, ticketId: ticketId, selectedUserId: '' });
      } else {
        await TicketService.updateTicket(ticketId, { status: 1 });
        await fetchTickets();
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };
// ... code existant ...
```

## À tester dans le navigateur

1. Aller dans la configuration du Kanban, modifier le plafond des réouvertures en le mettant à `20%` et valider.
2. Clôturer un ticket avec un supercoût de `100€` en le glissant dans la colonne Terminé.
3. Glisser à nouveau ce ticket dans Nouveau ou En cours, choisir Réouverture à `50%` en mode 4.
4. Constater que le coût de réouverture calculé est limité à `20€` (car le plafond est de `20%` de `100€` = `20€`, au lieu des `50€` normaux).
5. Cliquer sur le bouton d'annulation ou glisser un ticket et faire annuler, puis aller dans "Historique et Réouvertures" pour vérifier que la ligne annulée est reléguée tout en bas.
6. Cliquer sur le bouton "Rétablir" pour restaurer la ligne annulée et s'assurer qu'elle revient à son état initial actif.
