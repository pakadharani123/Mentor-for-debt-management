const FinancialProfile = require('../models/FinancialProfile');
const Loan = require('../models/Loan');
const PaymentHistory = require('../models/PaymentHistory');
const Expense = require('../models/Expense');
const ChatThread = require('../models/ChatThread');
const Conversation = require('../models/Conversation');
const RecoveryScoreService = require('../services/recoveryScoreService');
const ForecastService = require('../services/forecastService');
const SimulatorService = require('../services/simulatorService');
const DebtStrategyService = require('../services/debtStrategyService');
const AIService = require('../services/ai/aiService');
const AIIntentService = require('../services/ai/AIIntentService');
const asyncHandler = require('../utils/asyncHandler');
const { translate } = require('../utils/localizer');

/**
 * @desc    Generate personal AI-based financial guidance explanation
 * @route   POST /api/ai/advice
 * @access  Private
 */
const getAIAdvice = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userLang = req.user.preferredLanguage || 'en';
  const { loanId, proposedEmi, userQuestion, threadId } = req.body;

  // ──────────────────────────────────────────────────────────────
  // 1. Fetch complete user financial profile
  // ──────────────────────────────────────────────────────────────
  const profile = await FinancialProfile.findOne({ userId });
  if (!profile) {
    return res.status(400).json({
      success: false,
      error: translate(req, 'profile_not_found')
    });
  }

  // ──────────────────────────────────────────────────────────────
  // 2. Fetch ALL loans (active + paid off) for complete context
  // ──────────────────────────────────────────────────────────────
  const allLoans = await Loan.find({ userId }).sort({ createdAt: -1 });
  const loans = allLoans.filter(l => l.status === 'Active');
  const paidLoans = allLoans.filter(l => l.status === 'Paid Off');

  const loanCount = loans.length;
  const totalEMI = loans.reduce((sum, l) => sum + l.emi, 0);
  const remainingDebt = loans.reduce((sum, l) => sum + l.remainingAmount, 0);
  const totalPrincipal = loans.reduce((sum, l) => sum + l.principalAmount, 0);
  const totalInterestRate = loans.length > 0
    ? loans.reduce((sum, l) => sum + l.interestRate, 0) / loans.length
    : 0;

  // ──────────────────────────────────────────────────────────────
  // 3. Fetch payment history — full record for AI context
  // ──────────────────────────────────────────────────────────────
  const paymentsHistory = await PaymentHistory.find({ userId })
    .sort({ paymentDate: -1 })
    .limit(24)
    .populate('loanId', 'loanName loanType');

  const totalPayments = paymentsHistory.length;
  const paidOnTime = paymentsHistory.filter(p => p.status === 'Paid').length;
  const missedPayments = paymentsHistory.filter(p => p.status === 'Missed').length;
  const latePayments = paymentsHistory.filter(p => p.status === 'Late').length;
  const paymentCompliancePct = totalPayments > 0
    ? Math.round((paidOnTime / totalPayments) * 100)
    : 100;

  const recentPaymentsSummary = paymentsHistory.slice(0, 6).map(p => ({
    loan: p.loanId?.loanName || 'Unknown Loan',
    date: p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : 'N/A',
    amount: p.amount,
    status: p.status
  }));

  // ──────────────────────────────────────────────────────────────
  // 4. Fetch expenses with payment status breakdown for AI context
  // ──────────────────────────────────────────────────────────────
  let expenseBreakdown = [];
  let expenseStatusSummary = { paidTotal: 0, pendingTotal: 0, overdueTotal: 0, paidCount: 0, pendingCount: 0, overdueCount: 0 };
  let allExpenses = [];
  try {
    allExpenses = await Expense.find({ userId }).sort({ amount: -1 });

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
    const partialExp = allExpenses.filter(e => e.paymentStatus === 'Partially Paid');
    const pendingExp = allExpenses.filter(e => e.paymentStatus === 'Pending');
    const upcomingExp = allExpenses.filter(e => e.paymentStatus === 'Upcoming');
    const overdueExp = allExpenses.filter(e => e.paymentStatus === 'Overdue');

    expenseStatusSummary = {
      paidTotal: Math.round(allExpenses.reduce((s, e) => s + (e.amountPaid || 0), 0)),
      pendingTotal: Math.round(allExpenses.filter(e => ['Pending', 'Upcoming', 'Partially Paid'].includes(e.paymentStatus)).reduce((s, e) => s + (e.amount - (e.amountPaid || 0)), 0)),
      overdueTotal: Math.round(allExpenses.filter(e => e.paymentStatus === 'Overdue').reduce((s, e) => s + (e.amount - (e.amountPaid || 0)), 0)),
      paidCount: paidExp.length,
      pendingCount: pendingExp.length + upcomingExp.length,
      overdueCount: overdueExp.length,
      partialCount: partialExp.length
    };

    // Category breakdown for Paid / Partially Paid outflow (actual cash outflow)
    const categoryMap = {};
    allExpenses.forEach(e => {
      if (e.amountPaid > 0) {
        const cat = e.category || 'Other';
        categoryMap[cat] = (categoryMap[cat] || 0) + e.amountPaid;
      }
    });
    expenseBreakdown = Object.entries(categoryMap)
      .map(([category, amount]) => ({ category, amount: Math.round(amount), status: 'PaidPortion' }))
      .sort((a, b) => b.amount - a.amount);

    const pendingTop = [...pendingExp, ...upcomingExp].slice(0, 3).map(e => ({ category: e.category, amount: e.amount - (e.amountPaid || 0), status: e.paymentStatus, dueDate: e.dueDate ? new Date(e.dueDate).toLocaleDateString() : 'N/A' }));
    const overdueTop = overdueExp.slice(0, 3).map(e => ({ category: e.category, amount: e.amount - (e.amountPaid || 0), status: 'Overdue', dueDate: e.dueDate ? new Date(e.dueDate).toLocaleDateString() : 'N/A' }));
    expenseBreakdown = [...expenseBreakdown, ...overdueTop, ...pendingTop];
  } catch (_err) {
    console.warn('Failed to parse expenses context:', _err.message);
  }

  // ──────────────────────────────────────────────────────────────
  // 5. Backend computations (AI must never redo these)
  // ──────────────────────────────────────────────────────────────
  const surplus = profile.monthlyIncome - profile.monthlyExpenses - totalEMI;
  const dti = profile.monthlyIncome > 0 ? (totalEMI / profile.monthlyIncome) * 100 : 0;
  const emergencyFundMonths = profile.monthlyExpenses > 0
    ? profile.emergencyFund / profile.monthlyExpenses
    : 0;
  const savingsRatio = profile.monthlyIncome > 0
    ? (profile.savings / profile.monthlyIncome) * 100
    : 0;

  // Recovery score with full factor breakdown
  const recoveryResults = RecoveryScoreService.calculateScore({
    income: profile.monthlyIncome,
    expenses: profile.monthlyExpenses,
    savings: profile.savings,
    emergencyFund: profile.emergencyFund,
    totalEMI,
    loanCount,
    paymentsHistory
  });

  // Debt payoff forecast
  const debtForecast = ForecastService.generateForecast(loans, profile);

  // Strategy comparison (Avalanche vs Snowball)
  let avalancheResult = null;
  let snowballResult = null;
  if (loans.length > 0) {
    const simLoans = loans.map(l => ({
      id: l._id.toString(),
      name: l.loanName,
      principal: l.principalAmount,
      balance: l.remainingAmount,
      rate: l.interestRate,
      emi: l.emi
    }));
    const extraPayment = Math.max(0, surplus * 0.5);
    try {
      const avRes = DebtStrategyService.simulate(JSON.parse(JSON.stringify(simLoans)), extraPayment, 'avalanche');
      const sbRes = DebtStrategyService.simulate(JSON.parse(JSON.stringify(simLoans)), extraPayment, 'snowball');
      const extractOrder = (schedule) => {
        const paidOrder = [];
        const tracked = new Set();
        for (const monthData of schedule) {
          for (const pay of monthData.payments) {
            if (pay.remainingBalance <= 0 && !tracked.has(pay.loanId)) {
              tracked.add(pay.loanId);
              paidOrder.push(pay.loanName);
            }
          }
        }
        return paidOrder;
      };
      avalancheResult = {
        totalMonths: avRes.totalMonths,
        totalInterestPaid: Math.round(avRes.totalInterestPaid),
        order: extractOrder(avRes.schedule)
      };
      snowballResult = {
        totalMonths: sbRes.totalMonths,
        totalInterestPaid: Math.round(sbRes.totalInterestPaid),
        order: extractOrder(sbRes.schedule)
      };
    } catch (_e) {
      console.warn('Strategy comparison failed:', _e.message);
    }
  }

  // Simulator results
  let simulatorResults = { monthsReduced: 0, interestSaved: 0, proposedEmi: 0, targetLoan: null };
  if (loans.length > 0) {
    let targetLoan = null;
    let simProposedEmi = 0;
    let simCurrentEmi = 0;

    if (loanId && proposedEmi) {
      targetLoan = loans.find(l => l._id.toString() === loanId.toString());
      if (targetLoan) {
        simProposedEmi = proposedEmi;
        simCurrentEmi = targetLoan.emi;
      }
    } else {
      const sortedLoans = [...loans].sort((a, b) => b.remainingAmount - a.remainingAmount);
      targetLoan = sortedLoans[0];
      simCurrentEmi = targetLoan.emi;
      simProposedEmi = targetLoan.emi + 3000;
    }

    if (targetLoan) {
      const sim = SimulatorService.simulateProposedEmi(targetLoan, simCurrentEmi, simProposedEmi);
      if (!sim.error) {
        simulatorResults = {
          monthsReduced: sim.monthsReduced,
          interestSaved: sim.interestSaved,
          proposedEmi: simProposedEmi,
          targetLoan: targetLoan.loanName
        };
      }
    }
  }

  // ──────────────────────────────────────────────────────────────
  // 6. Gather historical trend analytics context (past 6 months)
  // ──────────────────────────────────────────────────────────────
  const debtTrendHistory = [];
  const healthScoreHistory = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fullPayments = await PaymentHistory.find({ userId });

  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const year = d.getFullYear();
    const month = d.getMonth();
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

    // 6a. Debt Trend
    let monthlyTotalDebt = 0;
    allLoans.forEach(loan => {
      if (new Date(loan.startDate) <= monthEnd) {
        const paymentsForLoan = fullPayments.filter(
          p => p.loanId.toString() === loan._id.toString() && new Date(p.paymentDate) <= monthEnd
        );
        const totalPaid = paymentsForLoan.reduce((sum, p) => sum + p.amountPaid, 0);
        let remainingBalance = loan.principalAmount - totalPaid;
        if (remainingBalance < 0) remainingBalance = 0;
        monthlyTotalDebt += remainingBalance;
      }
    });
    debtTrendHistory.push({
      month: `${monthNames[month]} ${year}`,
      totalDebt: Math.round(monthlyTotalDebt)
    });

    // 6b. Health Score history
    const monthlyLoans = allLoans.filter(l => new Date(l.startDate) <= monthEnd);
    const monthlyActiveLoans = monthlyLoans.filter(l => {
      const loanPaymentsBeforeEnd = fullPayments.filter(
        p => p.loanId.toString() === l._id.toString() && new Date(p.paymentDate) <= monthEnd
      );
      const totalPaid = loanPaymentsBeforeEnd.reduce((sum, p) => sum + p.amountPaid, 0);
      return totalPaid < l.principalAmount;
    });

    const loanCountAtMonth = monthlyActiveLoans.length;
    const totalEMIAtMonth = monthlyActiveLoans.reduce((sum, l) => sum + l.emi, 0);
    const paymentsUpToMonth = fullPayments.filter(p => new Date(p.paymentDate) <= monthEnd);

    const evalResult = RecoveryScoreService.calculateScore({
      income: profile.monthlyIncome,
      expenses: profile.monthlyExpenses,
      savings: profile.savings,
      emergencyFund: profile.emergencyFund,
      totalEMI: totalEMIAtMonth,
      loanCount: loanCountAtMonth,
      paymentsHistory: paymentsUpToMonth
    });

    healthScoreHistory.push({
      month: `${monthNames[month]} ${year}`,
      score: evalResult.score
    });
  }

  // Calculate actualSurplus and potentialSurplus
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const currentMonthPaidExpenses = allExpenses
    .filter(e => e.paymentStatus === 'Paid' && (e.paidDate || e.date) >= currentMonthStart && (e.paidDate || e.date) <= currentMonthEnd)
    .reduce((s, e) => s + e.amount, 0);

  const actualSurplus = profile.monthlyIncome - currentMonthPaidExpenses - totalEMI;
  const potentialSurplus = actualSurplus - expenseStatusSummary.pendingTotal - expenseStatusSummary.overdueTotal;

  // ──────────────────────────────────────────────────────────────
  // 7. Manage Conversational ChatGPT Thread & Memory
  // ──────────────────────────────────────────────────────────────
  let activeThreadId = threadId;
  let chatThread = null;

  if (activeThreadId) {
    chatThread = await ChatThread.findOne({ _id: activeThreadId, userId });
  }

  if (!chatThread) {
    const title = userQuestion
      ? (userQuestion.slice(0, 40) + (userQuestion.length > 40 ? '...' : ''))
      : 'New Advisory Chat';
    chatThread = await ChatThread.create({
      userId,
      title
    });
    activeThreadId = chatThread._id;
  } else {
    chatThread.updatedAt = new Date();
    await chatThread.save();
  }

  // Load last 25 turns from database for thread memory context
  const dbMessages = await Conversation.find({ threadId: activeThreadId, userId })
    .sort({ timestamp: -1 })
    .limit(25)
    .lean();

  dbMessages.reverse();

  const conversationHistory = dbMessages.map(m => ({
    role: m.role,
    content: m.role === 'user'
      ? m.content
      : (m.content.directAnswer || m.content.summary || '')
  }));

  // Save the user's current question before API call
  await Conversation.create({
    userId,
    threadId: activeThreadId,
    role: 'user',
    content: userQuestion || 'Provide general financial guidance.'
  });

  // ──────────────────────────────────────────────────────────────
  // 8. Detect intent
  // ──────────────────────────────────────────────────────────────
  const intent = AIIntentService.detectIntent(userQuestion);

  // ──────────────────────────────────────────────────────────────
  // 9. Build complete AI payload (fully detailed context)
  // ──────────────────────────────────────────────────────────────
  const aiInputPayload = {
    userQuestion: userQuestion || 'Provide general financial guidance based on my current financial situation.',
    intent,
    conversationHistory,
    language: userLang,

    // — Financial Profile —
    profile: {
      monthlyIncome: profile.monthlyIncome,
      monthlyExpenses: profile.monthlyExpenses,
      savings: profile.savings,
      emergencyFund: profile.emergencyFund,
      dependents: profile.dependents || 0,
      riskPreference: profile.riskPreference || 'Medium',
      employmentType: profile.employmentType || 'Salaried',
      salaryDate: profile.salaryDate || 1,
      financialGoals: profile.financialGoals || '',
      surplus: Math.round(surplus),
      dti: Math.round(dti * 100) / 100,
      emergencyFundMonths: Math.round(emergencyFundMonths * 100) / 100,
      savingsRatio: Math.round(savingsRatio * 100) / 100,
      auditTrail: profile.auditTrail || []
    },

    // — Recovery Score —
    recoveryScore: {
      score: recoveryResults.score,
      category: recoveryResults.category,
      strengths: recoveryResults.strengths,
      weaknesses: recoveryResults.weaknesses,
      improvementSuggestions: recoveryResults.improvementSuggestions,
      factors: recoveryResults.factors
    },

    // — Active Loans List —
    loans: loans.map(l => {
      const remainingTenure = l.dueDate
        ? Math.max(0, Math.round((new Date(l.dueDate) - new Date()) / (1000 * 60 * 60 * 24 * 30.4375)))
        : 'N/A';
      return {
        name: l.loanName,
        type: l.loanType,
        principalAmount: l.principalAmount,
        remainingAmount: l.remainingAmount,
        interestRate: l.interestRate,
        emi: l.emi,
        startDate: l.startDate ? new Date(l.startDate).toLocaleDateString('en-IN') : 'N/A',
        dueDate: l.dueDate ? new Date(l.dueDate).toLocaleDateString('en-IN') : 'N/A',
        remainingTenureMonths: remainingTenure,
        percentagePaid: Math.round(((l.principalAmount - l.remainingAmount) / l.principalAmount) * 100)
      };
    }),
    loanCount,
    totalEMI,
    remainingDebt,
    totalPrincipal,
    averageInterestRate: Math.round(totalInterestRate * 100) / 100,
    paidOffLoansCount: paidLoans.length,

    // — All Expenses —
    allExpenses: allExpenses.map(e => ({
      category: e.category,
      amount: e.amount,
      paymentStatus: e.paymentStatus,
      amountPaid: e.amountPaid || 0,
      dueDate: e.dueDate ? new Date(e.dueDate).toLocaleDateString('en-IN') : 'N/A',
      paidDate: e.paidDate ? new Date(e.paidDate).toLocaleDateString('en-IN') : 'N/A',
      paymentMethod: e.paymentMethod || 'N/A',
      notes: e.notes || ''
    })),
    expenseBreakdown,
    expenseStatus: expenseStatusSummary,

    // — Payment History —
    paymentHistory: {
      totalPayments,
      paidOnTime,
      missedPayments,
      latePayments,
      compliancePercent: paymentCompliancePct,
      recentPayments: recentPaymentsSummary
    },

    // — Debt Forecast —
    debtForecast: {
      estimatedDebtFreeDate: debtForecast.estimatedDebtFreeDate
        ? new Date(debtForecast.estimatedDebtFreeDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })
        : 'N/A',
      payoffMonthsRemaining: debtForecast.payoffMonthsRemaining,
      recommendedMonthlyPayment: debtForecast.recommendedMonthlyPayment,
      remainingPrincipal: debtForecast.remainingPrincipal,
      totalInterestRemaining: debtForecast.totalInterestRemaining
    },

    // — Strategy Comparison —
    strategyComparison: avalancheResult && snowballResult ? {
      avalanche: {
        totalMonths: avalancheResult.totalMonths,
        totalInterestPaid: Math.round(avalancheResult.totalInterestPaid),
        order: avalancheResult.order?.slice(0, 3) || []
      },
      snowball: {
        totalMonths: snowballResult.totalMonths,
        totalInterestPaid: Math.round(snowballResult.totalInterestPaid),
        order: snowballResult.order?.slice(0, 3) || []
      }
    } : null,

    // — Simulator Results —
    simulatorResults,

    // — Dashboard Metrics —
    dashboardMetrics: {
      totalDebt: remainingDebt,
      totalEMI,
      monthlyIncome: profile.monthlyIncome,
      monthlyExpenses: profile.monthlyExpenses,
      savings: profile.savings,
      emergencyFund: profile.emergencyFund,
      debtToIncomeRatio: dti,
      availableMonthlySurplus: surplus,
      actualSurplus,
      potentialSurplus,
      expenseStatus: expenseStatusSummary
    },

    // — Analytics History —
    analyticsHistory: {
      debtTrend: debtTrendHistory,
      healthScoreHistory
    }
  };

  // ──────────────────────────────────────────────────────────────
  // 10. Instantiate and run selected AI provider
  // ──────────────────────────────────────────────────────────────
  const provider = AIService.getProvider();
  const providerName = provider.constructor.name.replace('Provider', '');

  console.log('------------------------------------------------');
  console.log(`Using Provider: ${providerName}`);
  console.log(`Detected Intent: ${intent}`);
  console.log(`Thread ID: ${activeThreadId}`);
  console.log(`Question: ${userQuestion || '(none provided)'}`);
  console.log('------------------------------------------------');

  let advice;
  try {
    advice = await provider.generateFinancialAdvice(aiInputPayload);
  } catch (error) {
    console.error(`[AI Coach Diagnostics] AI Advisor Generation failed: ${error.message}`);
    // Clean up user question message so it doesn't leave an orphan user turn in the chat thread
    await Conversation.findOneAndDelete({
      userId,
      threadId: activeThreadId,
      role: 'user'
    }, { sort: { timestamp: -1 } });

    return res.status(503).json({
      success: false,
      error: 'AI service temporarily unavailable.'
    });
  }

  // Save the assistant's response to the database
  await Conversation.create({
    userId,
    threadId: activeThreadId,
    role: 'assistant',
    content: advice
  });

  res.status(200).json({
    success: true,
    data: advice,
    threadId: activeThreadId
  });
});

/**
 * @desc    Get all chat threads for the logged-in user
 * @route   GET /api/ai/history
 * @access  Private
 */
const getHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { search } = req.query;

  const filter = { userId };
  if (search) {
    filter.title = { $regex: search, $options: 'i' };
  }

  const threads = await ChatThread.find(filter)
    .sort({ updatedAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    data: threads
  });
});

/**
 * @desc    Get a single chat thread's full message history
 * @route   GET /api/ai/history/:id
 * @access  Private
 */
const getHistoryById = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const threadId = req.params.id;

  const thread = await ChatThread.findOne({ _id: threadId, userId }).lean();
  if (!thread) {
    return res.status(404).json({ success: false, error: 'Chat thread not found.' });
  }

  const messages = await Conversation.find({ threadId, userId })
    .sort({ timestamp: 1 })
    .lean();

  res.status(200).json({
    success: true,
    data: {
      thread,
      messages
    }
  });
});

/**
 * @desc    Rename a chat thread title
 * @route   PUT /api/ai/history/:id
 * @access  Private
 */
const renameHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const threadId = req.params.id;
  const { title } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, error: 'Title must not be empty.' });
  }

  const thread = await ChatThread.findOneAndUpdate(
    { _id: threadId, userId },
    { title: title.trim(), updatedAt: new Date() },
    { new: true }
  );

  if (!thread) {
    return res.status(404).json({ success: false, error: 'Chat thread not found.' });
  }

  res.status(200).json({
    success: true,
    data: thread
  });
});

/**
 * @desc    Delete a single chat thread and all its messages
 * @route   DELETE /api/ai/history/:id
 * @access  Private
 */
const deleteHistoryById = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const threadId = req.params.id;

  const thread = await ChatThread.findOneAndDelete({ _id: threadId, userId });
  if (!thread) {
    return res.status(404).json({ success: false, error: 'Chat thread not found.' });
  }

  // Delete all conversations/messages in thread
  await Conversation.deleteMany({ threadId, userId });

  res.status(200).json({
    success: true,
    message: 'Chat thread and its messages deleted successfully.'
  });
});

/**
 * @desc    Clear all conversation history for the user
 * @route   DELETE /api/ai/history
 * @access  Private
 */
const clearHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  await ChatThread.deleteMany({ userId });
  await Conversation.deleteMany({ userId });

  res.status(200).json({
    success: true,
    message: 'Cleared all chat threads and message logs successfully.'
  });
});

module.exports = {
  getAIAdvice,
  getHistory,
  getHistoryById,
  renameHistory,
  deleteHistoryById,
  clearHistory
};
