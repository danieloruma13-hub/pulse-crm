const express = require('express');
const router = express.Router();
const dealController = require('../controllers/dealController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/pipeline-value', dealController.getPipelineValue);
router.post('/', dealController.createDeal);
router.get('/', dealController.listDeals);
router.get('/:id', dealController.getDeal);
router.patch('/:id', dealController.updateDeal);
router.delete('/:id', dealController.deleteDeal);

module.exports = router;
