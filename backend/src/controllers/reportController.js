const FinancialProfile = require('../models/FinancialProfile');
const Loan = require('../models/Loan');
const User = require('../models/User');
const PaymentHistory = require('../models/PaymentHistory');
const Expense = require('../models/Expense');
const HealthScoreService = require('../services/healthScoreService');
const DebtStrategyService = require('../services/debtStrategyService');
const AIService = require('../services/ai/aiService');
const PDFReportService = require('../services/pdfReportService');
const asyncHandler = require('../utils/asyncHandler');
const { translate } = require('../utils/localizer');

/**
 * @desc    Generate and download complete financial PDF report
 * @route   GET /api/bonus/report/pdf
 * @access  Private
 */
const downloadPDFReport = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 1. Fetch user & profile
  const user = await User.findById(userId);
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
  const totalDebt = loans.reduce((sum, l) => sum + l.remainingAmount, 0);

  // 3. Compute dashboard details
  const debtToIncomeRatio = profile.monthlyIncome > 0 ? (totalEMI / profile.monthlyIncome) * 100 : 0;
  const availableMonthlySurplus = profile.monthlyIncome - profile.monthlyExpenses - totalEMI;

  const dashboard = {
    totalDebt,
    totalEMI,
    monthlyIncome: profile.monthlyIncome,
    monthlyExpenses: profile.monthlyExpenses,
    savings: profile.savings,
    emergencyFund: profile.emergencyFund,
    debtToIncomeRatio,
    availableMonthlySurplus,
    totalLoans: loanCount
  };

  // 4. Generate repayment plans
  const plans = DebtStrategyService.generateRepaymentPlans(loans, availableMonthlySurplus);

  // 5. Generate financial health score
  const health = HealthScoreService.calculateScore({
    income: profile.monthlyIncome,
    expenses: profile.monthlyExpenses,
    emergencyFund: profile.emergencyFund,
    totalEMI,
    loanCount
  });

  // 6. Gather payment history & expenses for AI payload
  const paymentsHistory = await PaymentHistory.find({ userId }).sort({ paymentDate: -1 });
  const totalPaymentsCount = paymentsHistory.length;
  const paidOnTime = paymentsHistory.filter(p => p.status === 'Paid').length;
  const missedPayments = paymentsHistory.filter(p => p.status === 'Missed').length;
  const latePayments = paymentsHistory.filter(p => p.status === 'Late').length;
  const paymentCompliancePct = totalPaymentsCount > 0 
    ? Math.round((paidOnTime / totalPaymentsCount) * 100) 
    : 100;

  const allExpenses = await Expense.find({ userId }).sort({ amount: -1 });
  const now = new Date();
  allExpenses.forEach(e => {
    if (e.paymentStatus === 'Partially Paid') {
      if (e.amountPaid >= e.amount) {
        e.paymentStatus = 'Paid';
        e.paidDate = e.paidDate || now;
      }
    } else if (e.paymentStatus !== 'Paid') {
      if (e.dueDate) {
        e.paymentStatus = now > new Date(e.dueDate) ? 'Overdue' : 'Upcoming';
      } else {
        e.paymentStatus = 'Pending';
      }
    }
  });

  const paidExp = allExpenses.filter(e => e.paymentStatus === 'Paid');
  const pendingExp = allExpenses.filter(e => e.paymentStatus === 'Pending' || e.paymentStatus === 'Upcoming' || e.paymentStatus === 'Partially Paid');
  const overdueExp = allExpenses.filter(e => e.paymentStatus === 'Overdue');

  const expenseStatusSummary = {
    paidTotal: paidExp.reduce((sum, e) => sum + (e.amountPaid || e.amount), 0),
    pendingTotal: pendingExp.reduce((sum, e) => sum + (e.amount - (e.amountPaid || 0)), 0),
    overdueTotal: overdueExp.reduce((sum, e) => sum + e.amount, 0),
    paidCount: paidExp.length,
    pendingCount: pendingExp.length,
    overdueCount: overdueExp.length
  };

  const expenseBreakdown = allExpenses.map(e => ({
    category: e.category,
    amount: e.amount,
    status: e.paymentStatus,
    dueDate: e.dueDate ? new Date(e.dueDate).toLocaleDateString() : 'N/A'
  }));

  // Build the complete schema matching GeminiProvider and OpenAIProvider requirements
  const aiPayload = {
    userQuestion: 'Provide a comprehensive financial health overview and audit of my active debt portfolio.',
    intent: 'GENERAL',
    language: user.preferredLanguage || 'en',
    profile,
    recoveryScore: {
      score: health.score,
      category: health.rating
    },
    loans: loans.map((l, i) => ({
      id: l._id ? l._id.toString() : String(i),
      name: l.loanName,
      type: l.loanType,
      principalAmount: l.principalAmount,
      remainingAmount: l.remainingAmount,
      interestRate: l.interestRate,
      emi: l.emi,
      percentagePaid: l.principalAmount > 0 ? Math.round(((l.principalAmount - l.remainingAmount) / l.principalAmount) * 100) : 0
    })),
    loanCount,
    totalEMI,
    remainingDebt: totalDebt,
    totalPrincipal: loans.reduce((sum, l) => sum + l.principalAmount, 0),
    averageInterestRate: loans.length > 0 ? loans.reduce((sum, l) => sum + l.interestRate, 0) / loans.length : 0,
    paidOffLoansCount: 0,
    paymentHistory: {
      totalPayments: totalPaymentsCount,
      paidOnTime,
      missedPayments,
      latePayments,
      compliancePercent: paymentCompliancePct
    },
    expenseBreakdown,
    expenseStatus: {
      paidTotal: expenseStatusSummary.paidTotal,
      pendingTotal: expenseStatusSummary.pendingTotal,
      overdueTotal: expenseStatusSummary.overdueTotal,
      paidCount: expenseStatusSummary.paidCount,
      pendingCount: expenseStatusSummary.pendingCount,
      overdueCount: expenseStatusSummary.overdueCount
    },
    debtForecast: {
      remainingPrincipal: totalDebt,
      totalInterestRemaining: -1,
      recommendedMonthlyPayment: availableMonthlySurplus > 0 ? totalEMI + (availableMonthlySurplus * 0.5) : totalEMI + 2000,
      payoffMonthsRemaining: -1,
      estimatedDebtFreeDate: null
    },
    strategyComparison: plans,
    simulatorResults: {}
  };

  // 7. Generate AI Advice
  const aiProvider = AIService.getProvider();
  
  let aiAdvice;
  try {
    aiAdvice = await aiProvider.generateFinancialAdvice(aiPayload);
  } catch (error) {
    console.warn(`Gemini API down/rate-limited (${error.message || error}). Falling back to local mock provider...`);
    const MockProvider = require('../services/ai/MockProvider');
    const mock = new MockProvider();
    aiAdvice = await mock.generateFinancialAdvice(aiPayload);
  }

  // Compile full report payload
  const reportPayload = {
    user: {
      name: user.name,
      preferredLanguage: user.preferredLanguage
    },
    dashboard,
    plans,
    health,
    aiAdvice
  };

  // 8. Setup response headers for file download
  const safeUsername = user.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=financial_report_${safeUsername}.pdf`
  );

  // 9. Stream PDF to response
  PDFReportService.generateReport(reportPayload, res);
});

module.exports = {
  downloadPDFReport
};
