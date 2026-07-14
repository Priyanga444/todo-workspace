const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics');
const authenticateToken = require('../middleware/auth');

router.use(authenticateToken);

router.get('/stats', analyticsController.getDashboardStats);
router.get('/charts', analyticsController.getAnalyticsCharts);

module.exports = router;
