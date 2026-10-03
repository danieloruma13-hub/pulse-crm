const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/summarize-leads', aiController.summarizeLeads);
router.post('/generate-email', aiController.generateFollowUpEmail);
router.post('/analyze-conversation', aiController.analyzeConversation);
router.get('/predict-deal/:dealId', aiController.predictDealSuccess);
router.get('/recommend-actions', aiController.recommendNextActions);
router.post('/chat', aiController.chat);

module.exports = router;
