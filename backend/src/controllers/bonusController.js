const FinancialProfile = require('../models/FinancialProfile');
const Loan = require('../models/Loan');
const SavingsGoal = require('../models/SavingsGoal');
const DebtStrategyService = require('../services/debtStrategyService');
const asyncHandler = require('../utils/asyncHandler');
const { translate } = require('../utils/localizer');

/**
 * @desc    Simulate impact of extra monthly/one-time payments on repayment
 * @route   POST /api/bonus/payoff-simulator
 * @access  Private
 */
const simulatePayoff = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { extraPayment, paymentType = 'monthly' } = req.body;

  // 1. Fetch profile & loans
  const profile = await FinancialProfile.findOne({ userId });
  if (!profile) {
    return res.status(400).json({
      success: false,
      error: translate(req, 'profile_not_found')
    });
  }

  const loans = await Loan.find({ userId, status: 'Active' });
  if (loans.length === 0) {
    return res.status(200).json({
      success: true,
      message: 'No active loans to simulate.'
    });
  }

  const totalEMI = loans.reduce((sum, l) => sum + l.emi, 0);
  const baseSurplus = Math.max(0, profile.monthlyIncome - profile.monthlyExpenses - totalEMI);

  // 2. Map loans for simulation
  const formatLoans = () => loans.map(l => ({
    id: l._id.toString(),
    name: l.loanName,
    principal: l.principalAmount,
    balance: l.remainingAmount,
    rate: l.interestRate,
    emi: l.emi
  }));

  // 3. Run baseline simulations (using Avalanche as baseline)
  const baseline = DebtStrategyService.simulate(formatLoans(), baseSurplus, 'avalanche');

  // 4. Run simulated repayment
  let simulated;
  if (paymentType === 'monthly') {
    simulated = DebtStrategyService.simulate(formatLoans(), baseSurplus + extraPayment, 'avalanche');
  } else {
    // One-time payment: We apply it in month 1
    const oneTimeLoans = formatLoans();
    
    // Sort and apply to highest rate loan immediately in simulation setup
    oneTimeLoans.sort((a, b) => b.rate - a.rate);
    let remainingOneTime = extraPayment;
    for (let i = 0; i < oneTimeLoans.length; i++) {
      if (remainingOneTime <= 0) break;
      const pay = Math.min(remainingOneTime, oneTimeLoans[i].balance);
      oneTimeLoans[i].balance -= pay;
      remainingOneTime -= pay;
    }
    
    simulated = DebtStrategyService.simulate(oneTimeLoans.filter(l => l.balance > 0), baseSurplus, 'avalanche');
  }

  const monthsSaved = Math.max(0, baseline.totalMonths - simulated.totalMonths);
  const interestSaved = Math.max(0, baseline.totalInterestPaid - simulated.totalInterestPaid);

  res.status(200).json({
    success: true,
    data: {
      baseline: {
        totalMonths: baseline.totalMonths,
        totalInterestPaid: Math.round(baseline.totalInterestPaid * 100) / 100
      },
      simulated: {
        totalMonths: simulated.totalMonths,
        totalInterestPaid: Math.round(simulated.totalInterestPaid * 100) / 100
      },
      analysis: {
        monthsSaved,
        interestSaved: Math.round(interestSaved * 100) / 100,
        payoffTimeReductionPercent: baseline.totalMonths > 0 ? Math.round((monthsSaved / baseline.totalMonths) * 100 * 10) / 10 : 0
      }
    }
  });
});

/**
 * @desc    Emergency Fund Planner
 * @route   GET /api/bonus/emergency-fund-planner
 * @access  Private
 */
const planEmergencyFund = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Fetch financial profile
  const profile = await FinancialProfile.findOne({ userId });
  if (!profile) {
    return res.status(400).json({
      success: false,
      error: translate(req, 'profile_not_found')
    });
  }

  const monthlyExpenses = profile.monthlyExpenses;
  const currentFund = profile.emergencyFund;

  const target3Months = monthlyExpenses * 3;
  const target6Months = monthlyExpenses * 6;

  const progress3Months = target3Months > 0 ? Math.min(100, (currentFund / target3Months) * 100) : 100;
  const progress6Months = target6Months > 0 ? Math.min(100, (currentFund / target6Months) * 100) : 100;

  let advice = '';
  if (currentFund < monthlyExpenses) {
    advice = 'Priority: Critical emergency fund level. Cut down discretionary expenses and save immediately until you have at least 1 month of expenses.';
  } else if (currentFund < target3Months) {
    advice = 'Starter fund achieved. Focus on accumulating 3 months of expenses to safeguard against sudden income losses.';
  } else if (currentFund < target6Months) {
    advice = 'Healthy cushion. You have basic stability. Aim to build towards 6 months to achieve fully secure financial safety.';
  } else {
    advice = 'Excellent emergency coverage! You are fully protected. You can confidently deploy your extra surplus towards aggressive debt paydown or investment assets.';
  }

  res.status(200).json({
    success: true,
    data: {
      currentFund: Math.round(currentFund * 100) / 100,
      monthlyExpenses: Math.round(monthlyExpenses * 100) / 100,
      milestones: {
        threeMonths: {
          target: Math.round(target3Months * 100) / 100,
          progressPercent: Math.round(progress3Months * 10) / 10
        },
        sixMonths: {
          target: Math.round(target6Months * 100) / 100,
          progressPercent: Math.round(progress6Months * 10) / 10
        }
      },
      advice
    }
  });
});

/**
 * @desc    Add a savings goal
 * @route   POST /api/bonus/savings-goals
 * @access  Private
 */
const addSavingsGoal = asyncHandler(async (req, res) => {
  const { title, targetAmount, currentAmount, targetDate } = req.body;

  const goal = await SavingsGoal.create({
    userId: req.user._id,
    title,
    targetAmount,
    currentAmount: currentAmount || 0,
    targetDate
  });

  res.status(201).json({
    success: true,
    message: translate(req, 'savings_goal_created', { title }),
    data: goal
  });
});

/**
 * @desc    Get all savings goals for the user
 * @route   GET /api/bonus/savings-goals
 * @access  Private
 */
const getSavingsGoals = asyncHandler(async (req, res) => {
  const goals = await SavingsGoal.find({ userId: req.user._id }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: goals.length,
    data: goals
  });
});

/**
 * @desc    Update a savings goal
 * @route   PUT /api/bonus/savings-goals/:id
 * @access  Private
 */
const updateSavingsGoal = asyncHandler(async (req, res) => {
  let goal = await SavingsGoal.findOne({ _id: req.params.id, userId: req.user._id });

  if (!goal) {
    return res.status(404).json({
      success: false,
      error: translate(req, 'resource_not_found')
    });
  }

  const updateFields = ['title', 'targetAmount', 'currentAmount', 'targetDate'];
  updateFields.forEach(field => {
    if (req.body[field] !== undefined) {
      goal[field] = req.body[field];
    }
  });

  await goal.save();

  res.status(200).json({
    success: true,
    message: translate(req, 'savings_goal_updated'),
    data: goal
  });
});

/**
 * @desc    Delete a savings goal
 * @route   DELETE /api/bonus/savings-goals/:id
 * @access  Private
 */
const deleteSavingsGoal = asyncHandler(async (req, res) => {
  const goal = await SavingsGoal.findOne({ _id: req.params.id, userId: req.user._id });

  if (!goal) {
    return res.status(404).json({
      success: false,
      error: translate(req, 'resource_not_found')
    });
  }

  await goal.deleteOne();

  res.status(200).json({
    success: true,
    message: translate(req, 'savings_goal_deleted')
  });
});

module.exports = {
  simulatePayoff,
  planEmergencyFund,
  addSavingsGoal,
  getSavingsGoals,
  updateSavingsGoal,
  deleteSavingsGoal
};
