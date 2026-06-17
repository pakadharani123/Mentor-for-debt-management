const User = require('../models/User');
const Loan = require('../models/Loan');
const FinancialProfile = require('../models/FinancialProfile');
const PaymentHistory = require('../models/PaymentHistory');
const RecoveryScoreService = require('../services/recoveryScoreService');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get administrative dashboard statistics
 * @route   GET /api/admin/dashboard
 * @access  Private/Admin
 */
const getAdminDashboard = asyncHandler(async (req, res) => {
  // 1. Core aggregations
  const totalUsers = await User.countDocuments();
  const totalLoans = await Loan.countDocuments({ status: 'Active' });
  
  const activeLoans = await Loan.find({ status: 'Active' });
  const totalDebtManaged = activeLoans.reduce((sum, l) => sum + l.remainingAmount, 0);
  const averageDebtPerUser = totalUsers > 0 ? (totalDebtManaged / totalUsers) : 0;

  // 2. Most common loan type
  const loanTypesAggregation = await Loan.aggregate([
    { $match: { status: 'Active' } },
    { $group: { _id: '$loanType', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 1 }
  ]);
  const mostCommonLoanType = loanTypesAggregation.length > 0 ? loanTypesAggregation[0]._id : 'None';

  // 3. Language usage distribution
  const langAggregation = await User.aggregate([
    { $group: { _id: '$preferredLanguage', count: { $sum: 1 } } }
  ]);
  const regionalLanguageUsage = { en: 0, te: 0, hi: 0, ta: 0 };
  langAggregation.forEach(lang => {
    if (lang._id in regionalLanguageUsage) {
      regionalLanguageUsage[lang._id] = lang.count;
    }
  });

  // 4. Calculate Average Recovery Score
  const users = await User.find();
  const profiles = await FinancialProfile.find();
  const payments = await PaymentHistory.find();

  let scoreSum = 0;
  let scoredUsersCount = 0;

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const userProfile = profiles.find(p => p.userId.toString() === user._id.toString());
    
    if (userProfile) {
      const userLoans = activeLoans.filter(l => l.userId.toString() === user._id.toString());
      const userPayments = payments.filter(p => p.userId.toString() === user._id.toString());
      const loanCount = userLoans.length;
      const totalEMI = userLoans.reduce((sum, l) => sum + l.emi, 0);

      const evalResult = RecoveryScoreService.calculateScore({
        income: userProfile.monthlyIncome,
        expenses: userProfile.monthlyExpenses,
        savings: userProfile.savings,
        emergencyFund: userProfile.emergencyFund,
        totalEMI,
        loanCount,
        paymentsHistory: userPayments
      });

      scoreSum += evalResult.score;
      scoredUsersCount++;
    }
  }

  const averageRecoveryScore = scoredUsersCount > 0 ? (scoreSum / scoredUsersCount) : 0;

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      totalLoans,
      totalDebtManaged: Math.round(totalDebtManaged * 100) / 100,
      averageDebtPerUser: Math.round(averageDebtPerUser * 100) / 100,
      mostCommonLoanType,
      regionalLanguageUsage,
      averageRecoveryScore: Math.round(averageRecoveryScore * 100) / 100
    }
  });
});

/**
 * @desc    Get user metadata lists
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
const getAdminUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

/**
 * @desc    Get system financial aggregations
 * @route   GET /api/admin/financial-summary
 * @access  Private/Admin
 */
const getAdminFinancialSummary = asyncHandler(async (req, res) => {
  const profiles = await FinancialProfile.find();
  const activeLoans = await Loan.find({ status: 'Active' });

  const totalIncome = profiles.reduce((sum, p) => sum + p.monthlyIncome, 0);
  const totalExpenses = profiles.reduce((sum, p) => sum + p.monthlyExpenses, 0);
  const totalSavings = profiles.reduce((sum, p) => sum + p.savings, 0);
  const totalEmergencyFund = profiles.reduce((sum, p) => sum + p.emergencyFund, 0);

  const totalOutstandingDebt = activeLoans.reduce((sum, l) => sum + l.remainingAmount, 0);
  const totalEMI = activeLoans.reduce((sum, l) => sum + l.emi, 0);

  // Emergency Fund coverage: total emergency funds / total monthly expenses
  const averageEmergencyCoverageMonths = totalExpenses > 0 ? (totalEmergencyFund / totalExpenses) : 0;

  res.status(200).json({
    success: true,
    data: {
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      totalSavings: Math.round(totalSavings * 100) / 100,
      totalEmergencyFund: Math.round(totalEmergencyFund * 100) / 100,
      totalOutstandingDebt: Math.round(totalOutstandingDebt * 100) / 100,
      totalEMI: Math.round(totalEMI * 100) / 100,
    }
  });
});

/**
 * @desc    Clear all temporary login restrictions (reset attempts and locks)
 * @route   POST /api/admin/reset-login-locks
 * @access  Private/Admin
 */
const resetAllLoginLocks = asyncHandler(async (req, res) => {
  const result = await User.updateMany(
    { $or: [{ loginAttempts: { $gt: 0 } }, { lockUntil: { $ne: null } }] },
    { $set: { loginAttempts: 0, lockUntil: null } }
  );

  console.log(`[Admin Diagnostics] Login locks manually reset by admin ${req.user.email}. Database reset count: ${result.modifiedCount}`);

  res.status(200).json({
    success: true,
    message: `Successfully reset login locks for all users. Reset count: ${result.modifiedCount}`
  });
});

module.exports = {
  getAdminDashboard,
  getAdminUsers,
  getAdminFinancialSummary,
  resetAllLoginLocks
};
