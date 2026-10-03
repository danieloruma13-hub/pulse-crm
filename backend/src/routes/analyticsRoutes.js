const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/overview', analyticsController.overview);
router.get('/revenue-trend', analyticsController.revenueTrend);
router.get('/lead-growth', analyticsController.leadGrowth);
router.get('/conversion-rate', analyticsController.conversionRate);
router.get('/sales-performance', analyticsController.salesPerformance);
router.get('/task-completion', analyticsController.taskCompletion);

module.exports = router;
