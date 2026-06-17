const FinancialProfile = require('../models/FinancialProfile');
const Loan = require('../models/Loan');
const DebtStrategyService = require('../services/debtStrategyService');
const asyncHandler = require('../utils/asyncHandler');
const { translate } = require('../utils/localizer');

/**
 * @desc    Generate debt repayment plans (Snowball vs Avalanche)
 * @route   GET /api/debt-plan
 * @access  Private
 */
const getDebtPlan = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 1. Fetch user's financial profile
  const profile = await FinancialProfile.findOne({ userId });
  if (!profile) {
    return res.status(400).json({
      success: false,
      error: translate(req, 'profile_not_found')
    });
  }

  // 2. Fetch active loans
  const loans = await Loan.find({ userId, status: 'Active' });
  if (loans.length === 0) {
    return res.status(200).json({
      success: true,
      message: 'No active loans found. You are debt free!',
      data: {
        snowballPlan: { totalMonths: 0, totalInterestPaid: 0, schedule: [] },
        avalanchePlan: { totalMonths: 0, totalInterestPaid: 0, schedule: [] },
        recommendedStrategy: 'None',
        estimatedMonths: 0,
        recommendationReason: 'No outstanding debt exists.'
      }
    });
  }

  // 3. Compute available monthly surplus
  const totalEMI = loans.reduce((sum, l) => sum + l.emi, 0);
  const monthlySurplus = profile.monthlyIncome - profile.monthlyExpenses - totalEMI;

  // 4. Generate plans using the Debt Strategy Engine
  const repaymentPlans = DebtStrategyService.generateRepaymentPlans(loans, monthlySurplus);

  res.status(200).json({
    success: true,
    data: repaymentPlans
  });
});

module.exports = {
  getDebtPlan
};
