const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/', messageController.createMessage);
router.get('/', messageController.listMessages);
router.get('/:id', messageController.getMessage);
router.delete('/:id', messageController.deleteMessage);

module.exports = router;
