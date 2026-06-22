const express = require('express');
const router = express.Router();
const ticketCostController = require('../controllers/TicketCostController');

router.post('/', ticketCostController.saveSuperCost);
router.get('/', ticketCostController.getAllSuperCosts);
router.get('/operations/all', ticketCostController.getCostOperations);
router.put('/operations/:operationKey', ticketCostController.updateCostOperation);
router.get('/:ticket_id', ticketCostController.getSuperCost);
router.delete('/:ticket_id', ticketCostController.deleteSuperCost);
router.post('/reopen', ticketCostController.saveReopenCost);
router.get('/reopen/all', ticketCostController.getAllReopenCosts);
router.get('/calculate-base/:ticket_id/:mode', ticketCostController.calculateBaseCost);
router.post('/reopen-custom', ticketCostController.saveCustomReopenCost);

module.exports = router;
