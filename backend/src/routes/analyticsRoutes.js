const express = require('express');
const {
  getDebtTrend,
  getExpenseBreakdown,
  getPayoffForecast,
  getFinancialHealthHistory
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // All analytics endpoints are protected

router.get('/debt-trend', getDebtTrend);
router.get('/expense-breakdown', getExpenseBreakdown);
router.get('/payoff-forecast', getPayoffForecast);
router.get('/financial-health-history', getFinancialHealthHistory);

module.exports = router;
