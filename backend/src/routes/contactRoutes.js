const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/', contactController.createContact);
router.get('/', contactController.listContacts);
router.get('/:id', contactController.getContact);
router.patch('/:id', contactController.updateContact);
router.delete('/:id', contactController.deleteContact);

module.exports = router;
