const express = require('express');
const router = express.Router();
const resetController = require('../controllers/reset.controller');

router.post('/local', resetController.resetLocalDatabase);
router.post('/glpi-auto-increment', resetController.resetGlpiAutoIncrement);

module.exports = router;