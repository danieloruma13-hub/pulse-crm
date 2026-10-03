const express = require('express');
const router = express.Router();
const chatHistoryController = require('../controllers/chatHistoryController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', chatHistoryController.getHistory);
router.delete('/', chatHistoryController.clearHistory);

module.exports = router;
