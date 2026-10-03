const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/upcoming', eventController.getUpcomingEvents);
router.post('/', eventController.createEvent);
router.get('/', eventController.listEvents);
router.get('/:id', eventController.getEvent);
router.patch('/:id', eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);

module.exports = router;
