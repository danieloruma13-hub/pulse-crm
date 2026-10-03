const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/', campaignController.createCampaign);
router.get('/', campaignController.listCampaigns);
router.get('/:id', campaignController.getCampaign);
router.patch('/:id', campaignController.updateCampaign);
router.delete('/:id', campaignController.deleteCampaign);
router.post('/:id/send', campaignController.sendCampaign);

module.exports = router;
