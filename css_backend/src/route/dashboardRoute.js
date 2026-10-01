const express = require('express');
const auth = require('../middlewares/auth');
const DashboardController = require('../controllers/DashboardController');

const router = express.Router();
const dashboardController = new DashboardController();

router.get('/recent-activity', auth(), dashboardController.getRecentActivity);
router.get('/portfolio-overview', auth(), dashboardController.getPortfolioOverview);

module.exports = router;
