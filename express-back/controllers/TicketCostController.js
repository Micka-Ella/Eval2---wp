const db = require('../database/db');

const operationKeySql = "COALESCE(group_id, 'row-' || id)";

const getOperationRows = (operationKey, type, ticketId) => db.prepare(`
  SELECT *
  FROM ticket_costs
  WHERE ${operationKeySql} = ? AND type_cout = ? AND id_ticket = ?
  ORDER BY id
`).all(operationKey, type, ticketId);

const updateGroupTotal = (rows, total, extraValues = {}) => {
  if (!rows.length) return;

  const previousTotal = rows.reduce((sum, row) => sum + Number(row.cout || 0), 0);
  const update = db.prepare(`
    UPDATE ticket_costs
    SET cout = ?, percentage = COALESCE(?, percentage),
        calculation_mode = COALESCE(?, calculation_mode),
        base_cost = COALESCE(?, base_cost)
    WHERE id = ?
  `);

  rows.forEach((row, index) => {
    const ratio = previousTotal > 0 ? Number(row.cout || 0) / previousTotal : 1 / rows.length;
    const amount = index === rows.length - 1
      ? total - rows.slice(0, -1).reduce((sum, current) => {
          const currentRatio = previousTotal > 0
            ? Number(current.cout || 0) / previousTotal
            : 1 / rows.length;
          return sum + total * currentRatio;
        }, 0)
      : total * ratio;

    update.run(
      amount,
      extraValues.percentage ?? null,
      extraValues.mode ?? null,
      extraValues.baseCost ?? null,
      row.id
    );
  });
};

const getSuperOperationsBefore = (ticketId, beforeId) => db.prepare(`
  SELECT
    ${operationKeySql} AS operation_key,
    MIN(id) AS first_id,
    SUM(cout) AS total
  FROM ticket_costs
  WHERE id_ticket = ? AND type_cout = 'super_cost' AND id < ?
  GROUP BY ${operationKeySql}
  ORDER BY first_id
`).all(ticketId, beforeId);

const calculateBaseFromOperations = (operations, mode) => {
  if (!operations.length) return 0;
  if (mode === 1) return Number(operations[operations.length - 1].total || 0);
  if (mode === 2) return Number(operations[0].total || 0);
  if (mode === 3) {
    return operations.reduce((sum, operation) => sum + Number(operation.total || 0), 0) / operations.length;
  }
  if (mode === 4) {
    return operations.reduce((sum, operation) => sum + Number(operation.total || 0), 0);
  }
  return 0;
};

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
    updateGroupTotal(rows, base * percentage / 100, { percentage, mode, baseCost: base });
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
    COUNT(*) AS batch_size
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
        ...reopenValues,
      });
    }
  }

  return history.sort((a, b) => a.first_id - b.first_id);
};

exports.saveSuperCost = (req, res) => {
  const { ticket_id, super_cost, id_item, id_category, group_id } = req.body;

  if (!ticket_id || super_cost === undefined) {
    return res.status(400).json({ error: 'ticket_id and super_cost are required' });
  }

  try {
    const stmt = db.prepare('INSERT INTO ticket_costs (id_ticket, type_cout, cout, id_item, id_category, group_id, created_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)');
    stmt.run(ticket_id, 'super_cost', super_cost, id_item || null, id_category || null, group_id || null);
    res.status(200).json({ message: 'Super cost saved successfully', ticket_id, super_cost });
  } catch (error) {
    console.error('Error saving super cost:', error);
    res.status(500).json({ error: 'Failed to save super cost', details: error.message });
  }
};

exports.getAllSuperCosts = (req, res) => {
  try {
    const stmt = db.prepare('SELECT id_ticket as ticket_id, cout as super_cost FROM ticket_costs WHERE type_cout = ?');
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
    const stmt = db.prepare('SELECT SUM(cout) as total_super_cost FROM ticket_costs WHERE id_ticket = ? AND type_cout = ?');
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
    const lastStmt = db.prepare('SELECT id, group_id FROM ticket_costs WHERE id_ticket = ? AND type_cout = ? ORDER BY id DESC LIMIT 1');
    const lastRow = lastStmt.get(ticket_id, 'super_cost');
    
    if (lastRow) {
      if (lastRow.group_id) {
        const deleteStmt = db.prepare('DELETE FROM ticket_costs WHERE group_id = ? AND id_ticket = ? AND type_cout = ?');
        deleteStmt.run(lastRow.group_id, ticket_id, 'super_cost');
      } else {
        const deleteStmt = db.prepare('DELETE FROM ticket_costs WHERE id = ?');
        deleteStmt.run(lastRow.id);
      }
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
      WHERE id_ticket = ? AND type_cout = 'super_cost'
      ORDER BY id DESC LIMIT 1
    `).get(ticket_id);
    if (lastRow) {
      const baseCost = db.prepare(`
        SELECT SUM(cout) AS total
        FROM ticket_costs
        WHERE ${operationKeySql} = ? AND id_ticket = ? AND type_cout = 'super_cost'
      `).get(lastRow.operation_key, ticket_id).total || 0;
      const reopen_cost = baseCost * (percentage / 100);
      const insertStmt = db.prepare(`
        INSERT INTO ticket_costs (
          id_ticket, type_cout, cout, id_item, id_category, group_id,
          created_at, percentage, calculation_mode, base_cost
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, 1, ?)
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
    const stmt = db.prepare('SELECT id_ticket as ticket_id, cout as reopen_cost FROM ticket_costs WHERE type_cout = ?');
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
    
    if (modeInt === 1) { // Dernier super cost
      const lastRow = db.prepare("SELECT group_id, cout FROM ticket_costs WHERE id_ticket = ? AND type_cout = 'super_cost' ORDER BY id DESC LIMIT 1").get(ticket_id);
      if (lastRow) {
        if (lastRow.group_id) {
          base_cost = db.prepare("SELECT SUM(cout) as total FROM ticket_costs WHERE group_id = ? AND id_ticket = ? AND type_cout = 'super_cost'").get(lastRow.group_id, ticket_id).total;
        } else {
          base_cost = lastRow.cout;
        }
      }
    } else if (modeInt === 2) { // Premier super cost
      const firstRow = db.prepare("SELECT group_id, cout FROM ticket_costs WHERE id_ticket = ? AND type_cout = 'super_cost' ORDER BY id ASC LIMIT 1").get(ticket_id);
      if (firstRow) {
        if (firstRow.group_id) {
          base_cost = db.prepare("SELECT SUM(cout) as total FROM ticket_costs WHERE group_id = ? AND id_ticket = ? AND type_cout = 'super_cost'").get(firstRow.group_id, ticket_id).total;
        } else {
          base_cost = firstRow.cout;
        }
      }
    } else if (modeInt === 3) { // Moyenne des supercosts
      const allRows = db.prepare("SELECT id, group_id, cout FROM ticket_costs WHERE id_ticket = ? AND type_cout = 'super_cost'").all(ticket_id);
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
    } else if (modeInt === 4) { // Somme des supercosts
      const sumRow = db.prepare("SELECT SUM(cout) as total FROM ticket_costs WHERE id_ticket = ? AND type_cout = 'super_cost'").get(ticket_id);
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

exports.saveCustomReopenCost = (req, res) => {
  const { ticket_id, calculated_cost, id_item, id_category, group_id, percentage, mode, base_cost } = req.body;
  try {
    const insertStmt = db.prepare(`
      INSERT INTO ticket_costs (
        id_ticket, type_cout, cout, id_item, id_category, group_id,
        created_at, percentage, calculation_mode, base_cost
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)
    `);
    insertStmt.run(
      ticket_id,
      'reopen_cost',
      calculated_cost,
      id_item || null,
      id_category || null,
      group_id || null,
      percentage ?? null,
      mode ?? null,
      base_cost ?? null
    );
    res.status(200).json({ reopen_cost: calculated_cost });
  } catch (error) {
    console.error('Error saving custom reopen cost:', error);
    res.status(500).json({ error: 'Failed to save custom reopen cost' });
  }
};

exports.getCostOperations = (req, res) => {
  try {
    hydrateLegacyReopenMetadata();
    res.json(buildCostHistory(getGroupedCostOperations()));
  } catch (error) {
    console.error('Error getting cost operations:', error);
    res.status(500).json({ error: 'Failed to load cost operations', details: error.message });
  }
};

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
        updateGroupTotal(rows, base * parsedPercentage / 100, {
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
