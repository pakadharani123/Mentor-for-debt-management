const express = require('express');
const {
  simulatePayoff,
  planEmergencyFund,
  addSavingsGoal,
  getSavingsGoals,
  updateSavingsGoal,
  deleteSavingsGoal
} = require('../controllers/bonusController');
const { downloadPDFReport } = require('../controllers/reportController');
const { simulatorValidator, savingsGoalValidator } = require('../validators/bonusValidator');
const { validate } = require('../middleware/validatorMiddleware');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // All bonus features require authentication

// Simulators & Planners
router.post('/payoff-simulator', simulatorValidator, validate, simulatePayoff);
router.get('/emergency-fund-planner', planEmergencyFund);

// Savings Goals CRUD
router.post('/savings-goals', savingsGoalValidator, validate, addSavingsGoal);
router.get('/savings-goals', getSavingsGoals);
router.put('/savings-goals/:id', savingsGoalValidator, validate, updateSavingsGoal);
router.delete('/savings-goals/:id', deleteSavingsGoal);

// Reports
router.get('/report/pdf', downloadPDFReport);

module.exports = router;
