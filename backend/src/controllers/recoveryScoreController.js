const FinancialProfile = require('../models/FinancialProfile');
const Loan = require('../models/Loan');
const PaymentHistory = require('../models/PaymentHistory');
const RecoveryScoreService = require('../services/recoveryScoreService');
const asyncHandler = require('../utils/asyncHandler');
const { translate } = require('../utils/localizer');

/**
 * @desc    Get advanced Financial Recovery Score and breakdown
 * @route   GET /api/recovery-score
 * @access  Private
 */
const getRecoveryScore = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 1. Fetch profile
  const profile = await FinancialProfile.findOne({ userId });
  if (!profile) {
    return res.status(400).json({
      success: false,
      error: translate(req, 'profile_not_found')
    });
  }

  // 2. Fetch active loans
  const loans = await Loan.find({ userId, status: 'Active' });
  const loanCount = loans.length;
  const totalEMI = loans.reduce((sum, l) => sum + l.emi, 0);

  // 3. Fetch payment history
  const paymentsHistory = await PaymentHistory.find({ userId });

  // 4. Compute Score in service
  const recoveryResults = RecoveryScoreService.calculateScore({
    income: profile.monthlyIncome,
    expenses: profile.monthlyExpenses,
    savings: profile.savings,
    emergencyFund: profile.emergencyFund,
    totalEMI,
    loanCount,
    paymentsHistory
  });

  res.status(200).json({
    success: true,
    data: recoveryResults
  });
});

module.exports = {
  getRecoveryScore
};
