const FinancialProfile = require('../models/FinancialProfile');
const Loan = require('../models/Loan');
const Expense = require('../models/Expense');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get dashboard metrics and analysis
 * @route   GET /api/dashboard
 * @access  Private
 */
const getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 1. Fetch user's financial profile
  const profile = await FinancialProfile.findOne({ userId });

  const monthlyIncome = profile ? profile.monthlyIncome : 0;
  const monthlyExpenses = profile ? profile.monthlyExpenses : 0;
  const savings = profile ? profile.savings : 0;
  const emergencyFund = profile ? profile.emergencyFund : 0;

  // 2. Fetch active loans
  const loans = await Loan.find({ userId, status: 'Active' });
  let totalDebt = 0;
  let totalEMI = 0;
  const totalLoans = loans.length;

  loans.forEach((loan) => {
    totalDebt += loan.remainingAmount;
    totalEMI += loan.emi;
  });

  // 3. Auto-refresh any overdue and upcoming expenses (non-blocking best-effort)
  const now = new Date();
  await Expense.updateMany(
    { userId, paymentStatus: { $in: ['Pending', 'Upcoming'] }, dueDate: { $lt: now } },
    { $set: { paymentStatus: 'Overdue' } }
  );
  await Expense.updateMany(
    { userId, paymentStatus: { $in: ['Pending', 'Overdue'] }, dueDate: { $gt: now } },
    { $set: { paymentStatus: 'Upcoming' } }
  );

  // 4. Fetch expense totals split by payment status
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const allExpenses = await Expense.find({ userId });

  // Actual cash outflow = confirmed paid amounts (fully paid + partially paid portions)
  const actualPaidTotal = allExpenses.reduce((s, e) => s + (e.amountPaid || 0), 0);
  
  // Pending Obligations = outstanding unpaid amount for Pending, Upcoming, and Partially Paid
  const pendingObligations = allExpenses
    .filter(e => ['Pending', 'Upcoming', 'Partially Paid'].includes(e.paymentStatus))
    .reduce((s, e) => s + (e.amount - (e.amountPaid || 0)), 0);

  // Overdue Obligations = outstanding unpaid amount for Overdue
  const overdueObligations = allExpenses
    .filter(e => e.paymentStatus === 'Overdue')
    .reduce((s, e) => s + (e.amount - (e.amountPaid || 0)), 0);

  // ── Surplus calculations ────────────────────────────────────────────
  const debtToIncomeRatio = monthlyIncome > 0 ? (totalEMI / monthlyIncome) * 100 : 0;
  const availableMonthlySurplus = monthlyIncome - monthlyExpenses - totalEMI;

  // Accurate actual surplus: income - PAID portions this month - EMIs
  const currentMonthPaid = allExpenses
    .filter(e => {
      const d = e.paidDate || e.date;
      return d && new Date(d) >= monthStart && new Date(d) <= monthEnd;
    })
    .reduce((s, e) => s + (e.amountPaid || 0), 0);

  const actualSurplus = monthlyIncome - currentMonthPaid - totalEMI;
  const potentialSurplus = actualSurplus - pendingObligations - overdueObligations;

  res.status(200).json({
    success: true,
    data: {
      // Core fields
      totalDebt: Math.round(totalDebt * 100) / 100,
      totalEMI: Math.round(totalEMI * 100) / 100,
      monthlyIncome: Math.round(monthlyIncome * 100) / 100,
      monthlyExpenses: Math.round(monthlyExpenses * 100) / 100,
      savings: Math.round(savings * 100) / 100,
      emergencyFund: Math.round(emergencyFund * 100) / 100,
      debtToIncomeRatio: Math.round(debtToIncomeRatio * 100) / 100,
      availableMonthlySurplus: Math.round(availableMonthlySurplus * 100) / 100,
      totalLoans,
      hasFinancialProfile: !!profile,

      // ── New accurate expense split ──────────────────────────────────
      expenseStatus: {
        actualPaidTotal: Math.round(actualPaidTotal * 100) / 100,
        pendingObligations: Math.round(pendingObligations * 100) / 100,
        overdueObligations: Math.round(overdueObligations * 100) / 100,
        paidCount: allExpenses.filter(e => e.paymentStatus === 'Paid').length,
        pendingCount: allExpenses.filter(e => ['Pending', 'Upcoming'].includes(e.paymentStatus)).length,
        overdueCount: allExpenses.filter(e => e.paymentStatus === 'Overdue').length,
        partialCount: allExpenses.filter(e => e.paymentStatus === 'Partially Paid').length
      },
      actualSurplus: Math.round(actualSurplus * 100) / 100,
      potentialSurplus: Math.round(potentialSurplus * 100) / 100
    }
  });
});

module.exports = { getDashboard };
