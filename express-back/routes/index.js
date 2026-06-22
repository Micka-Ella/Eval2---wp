const express = require('express');
const router = express.Router();

const settingsRoutes = require('./settings.routes');
const ticketCostRoutes = require('./ticketCost.routes');
const resetRoutes = require('./reset.routes');

router.use('/settings', settingsRoutes);
router.use('/ticket-cost', ticketCostRoutes);
router.use('/reset', resetRoutes);

module.exports = router;