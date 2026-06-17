const Loan = require('../models/Loan');
const Expense = require('../models/Expense');
const PaymentHistory = require('../models/PaymentHistory');
const FinancialProfile = require('../models/FinancialProfile');
const DebtStrategyService = require('../services/debtStrategyService');
const RecoveryScoreService = require('../services/recoveryScoreService');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get monthly debt reduction trend (past 6 months)
 * @route   GET /api/analytics/debt-trend
 * @access  Private
 */
const getDebtTrend = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const activeLoans = await Loan.find({ userId });
  const payments = await PaymentHistory.find({ userId });

  const trend = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Reconstruct balances month-by-month for the past 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const year = d.getFullYear();
    const month = d.getMonth();
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

    let monthlyTotalDebt = 0;

    activeLoans.forEach(loan => {
      // Loan must have started on or before this month
      if (new Date(loan.startDate) <= monthEnd) {
        // Get payments for this loan up to the end of this month
        const paymentsForLoan = payments.filter(
          p => p.loanId.toString() === loan._id.toString() && new Date(p.paymentDate) <= monthEnd
        );
        const totalPaid = paymentsForLoan.reduce((sum, p) => sum + p.amountPaid, 0);

        let remainingBalance = loan.principalAmount - totalPaid;
        if (remainingBalance < 0) remainingBalance = 0;
        
        // If loan was paid off prior to this month, check if it shouldn't be included
        // In simple terms, if the remaining balance is zero, it represents paid off debt
        monthlyTotalDebt += remainingBalance;
      }
    });

    trend.push({
      name: `${monthNames[month]} ${year}`,
      debt: Math.round(monthlyTotalDebt * 100) / 100
    });
  }

  res.status(200).json({
    success: true,
    data: trend
  });
});

/**
 * @desc    Get expense categorization breakdown (Paid expenses = actual outflow)
 * @route   GET /api/analytics/expense-breakdown
 * @access  Private
 */
const getExpenseBreakdown = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Only count PAID expenses as actual outflow
  const paidExpenses = await Expense.find({ userId, paymentStatus: 'Paid' });
  const pendingExpenses = await Expense.find({ userId, paymentStatus: { $in: ['Pending', 'Overdue'] } });

  const categoryTotals = {};
  let totalAmount = 0;

  paidExpenses.forEach(e => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    totalAmount += e.amount;
  });

  const breakdown = Object.keys(categoryTotals).map(cat => ({
    category: cat,
    amount: Math.round(categoryTotals[cat] * 100) / 100,
    percentage: totalAmount > 0 ? Math.round((categoryTotals[cat] / totalAmount) * 100 * 10) / 10 : 0,
    status: 'Paid'
  }));

  // Payment fulfillment stats
  const totalPaid = paidExpenses.reduce((s, e) => s + e.amount, 0);
  const totalPending = pendingExpenses.filter(e => e.paymentStatus === 'Pending').reduce((s, e) => s + e.amount, 0);
  const totalOverdue = pendingExpenses.filter(e => e.paymentStatus === 'Overdue').reduce((s, e) => s + e.amount, 0);

  res.status(200).json({
    success: true,
    data: breakdown,
    paymentSummary: {
      paidTotal: Math.round(totalPaid * 100) / 100,
      pendingTotal: Math.round(totalPending * 100) / 100,
      overdueTotal: Math.round(totalOverdue * 100) / 100,
      fulfillmentRate: (paidExpenses.length + pendingExpenses.length) > 0
        ? Math.round((paidExpenses.length / (paidExpenses.length + pendingExpenses.length)) * 100)
        : 0
    }
  });
});

/**
 * @desc    Get projected debt payoff forecast timeline
 * @route   GET /api/analytics/payoff-forecast
 * @access  Private
 */
const getPayoffForecast = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const loans = await Loan.find({ userId, status: 'Active' });
  const profile = await FinancialProfile.findOne({ userId });

  if (loans.length === 0) {
    return res.status(200).json({
      success: true,
      data: []
    });
  }

  const totalEMI = loans.reduce((sum, l) => sum + l.emi, 0);
  const surplus = profile ? Math.max(0, profile.monthlyIncome - profile.monthlyExpenses - totalEMI) : 0;

  // Format loans for strategy simulator
  const simLoans = loans.map(l => ({
    id: l._id.toString(),
    name: l.loanName,
    principal: l.principalAmount,
    balance: l.remainingAmount,
    rate: l.interestRate,
    emi: l.emi
  }));

  // Run simulation under baseline current parameters
  const strategySim = DebtStrategyService.simulate(simLoans, surplus, 'avalanche');
  
  const forecastChart = strategySim.schedule.map(pt => ({
    month: `Month ${pt.month}`,
    remainingDebt: pt.remainingDebt
  }));

  res.status(200).json({
    success: true,
    data: forecastChart
  });
});

/**
 * @desc    Get historical Financial Recovery Score progression
 * @route   GET /api/analytics/financial-health-history
 * @access  Private
 */
const getFinancialHealthHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const profile = await FinancialProfile.findOne({ userId });
  if (!profile) {
    return res.status(200).json({
      success: true,
      data: []
    });
  }

  const loans = await Loan.find({ userId });
  const payments = await PaymentHistory.find({ userId });

  const history = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Reconstruct scores over the past 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const year = d.getFullYear();
    const month = d.getMonth();
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

    // Filter active loans up to that date
    const monthlyLoans = loans.filter(l => new Date(l.startDate) <= monthEnd);
    const monthlyActiveLoans = monthlyLoans.filter(l => {
      // Check if it was paid off in the future, if so, it was active then
      const loanPaymentsBeforeEnd = payments.filter(
        p => p.loanId.toString() === l._id.toString() && new Date(p.paymentDate) <= monthEnd
      );
      const totalPaid = loanPaymentsBeforeEnd.reduce((sum, p) => sum + p.amountPaid, 0);
      return totalPaid < l.principalAmount;
    });

    const loanCount = monthlyActiveLoans.length;
    const totalEMI = monthlyActiveLoans.reduce((sum, l) => sum + l.emi, 0);

    // Payments history up to that point
    const monthlyPayments = payments.filter(p => new Date(p.paymentDate) <= monthEnd);

    // Run recovery calculation for that point in history
    const evalResult = RecoveryScoreService.calculateScore({
      income: profile.monthlyIncome,
      expenses: profile.monthlyExpenses,
      savings: profile.savings,
      emergencyFund: profile.emergencyFund,
      totalEMI,
      loanCount,
      paymentsHistory: monthlyPayments
    });

    history.push({
      name: `${monthNames[month]} ${year}`,
      score: evalResult.score
    });
  }

  res.status(200).json({
    success: true,
    data: history
  });
});

module.exports = {
  getDebtTrend,
  getExpenseBreakdown,
  getPayoffForecast,
  getFinancialHealthHistory
};
