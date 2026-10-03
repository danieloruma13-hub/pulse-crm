const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/pipeline-summary', leadController.getPipelineSummary);
router.post('/', leadController.createLead);
router.get('/', leadController.listLeads);
router.get('/:id', leadController.getLead);
router.patch('/:id', leadController.updateLead);
router.delete('/:id', leadController.deleteLead);

module.exports = router;
