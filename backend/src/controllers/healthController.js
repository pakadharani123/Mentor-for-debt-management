const FinancialProfile = require('../models/FinancialProfile');
const Loan = require('../models/Loan');
const HealthScoreService = require('../services/healthScoreService');
const asyncHandler = require('../utils/asyncHandler');
const { translate } = require('../utils/localizer');

/**
 * @desc    Get financial health risk evaluation
 * @route   GET /api/financial-health
 * @access  Private
 */
const getFinancialHealth = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 1. Fetch user's financial profile
  const profile = await FinancialProfile.findOne({ userId });
  if (!profile) {
    return res.status(400).json({
      success: false,
      error: translate(req, 'profile_not_found')
    });
  }

  // 2. Fetch active loans metrics
  const loans = await Loan.find({ userId, status: 'Active' });
  const loanCount = loans.length;
  const totalEMI = loans.reduce((sum, l) => sum + l.emi, 0);

  // 3. Compute score using the service
  const healthEvaluation = HealthScoreService.calculateScore({
    income: profile.monthlyIncome,
    expenses: profile.monthlyExpenses,
    emergencyFund: profile.emergencyFund,
    totalEMI,
    loanCount
  });

  res.status(200).json({
    success: true,
    data: healthEvaluation
  });
});

module.exports = {
  getFinancialHealth
};
