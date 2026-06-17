const Expense = require('../models/Expense');
const asyncHandler = require('../utils/asyncHandler');
const { translate } = require('../utils/localizer');

/**
 * Helper: refresh overdue and upcoming statuses for a user's unpaid expenses
 */
const refreshOverdueStatuses = async (userId) => {
  const now = new Date();
  // 1. Unpaid past due date -> Overdue
  await Expense.updateMany(
    {
      userId,
      paymentStatus: { $in: ['Pending', 'Upcoming'] },
      dueDate: { $lt: now }
    },
    { $set: { paymentStatus: 'Overdue' } }
  );

  // 2. Unpaid future due date -> Upcoming
  await Expense.updateMany(
    {
      userId,
      paymentStatus: { $in: ['Pending', 'Overdue'] },
      dueDate: { $gt: now }
    },
    { $set: { paymentStatus: 'Upcoming' } }
  );
};

/**
 * @desc    Add an expense
 * @route   POST /api/expenses
 * @access  Private
 */
const addExpense = asyncHandler(async (req, res) => {
  const {
    amount, category, description,
    date, dueDate,
    paymentStatus, amountPaid, paidDate, paymentMethod, notes
  } = req.body;

  let status = paymentStatus || 'Pending';
  let effectiveAmountPaid = parseFloat(amountPaid) || 0;

  // Enforce amountPaid rules based on status
  if (status === 'Paid') {
    effectiveAmountPaid = parseFloat(amount);
  } else if (status === 'Partially Paid') {
    if (effectiveAmountPaid >= parseFloat(amount)) {
      status = 'Paid';
      effectiveAmountPaid = parseFloat(amount);
    }
  } else {
    effectiveAmountPaid = 0;
  }

  // Adjust status based on clock if unpaid
  const effectiveDueDate = dueDate ? new Date(dueDate) : null;
  if (status !== 'Paid' && status !== 'Partially Paid') {
    if (effectiveDueDate) {
      status = new Date() > effectiveDueDate ? 'Overdue' : 'Upcoming';
    } else {
      status = 'Pending';
    }
  }

  const expense = await Expense.create({
    userId: req.user._id,
    amount,
    category,
    description,
    date: date || dueDate || new Date(),
    dueDate: effectiveDueDate,
    paymentStatus: status,
    amountPaid: effectiveAmountPaid,
    paidDate: (status === 'Paid' || status === 'Partially Paid') ? (paidDate ? new Date(paidDate) : new Date()) : null,
    paymentMethod: (status === 'Paid' || status === 'Partially Paid') ? (paymentMethod || null) : null,
    notes: notes || null
  });

  res.status(201).json({
    success: true,
    message: translate(req, 'expense_created', { amount, category }),
    data: expense
  });
});

/**
 * @desc    Get all expenses for the current user
 * @route   GET /api/expenses
 * @access  Private
 */
const getExpenses = asyncHandler(async (req, res) => {
  await refreshOverdueStatuses(req.user._id);

  const { status } = req.query;
  const filter = { userId: req.user._id };

  const allowedStatuses = ['Pending', 'Paid', 'Overdue', 'Partially Paid', 'Upcoming'];
  if (status && allowedStatuses.includes(status)) {
    filter.paymentStatus = status;
  }

  const expenses = await Expense.find(filter).sort({ createdAt: -1 });

  // Summary statistics calculations
  const all = await Expense.find({ userId: req.user._id });
  
  // paidTotal is the actual money confirmed paid (sum of amountPaid)
  const paidTotal = all.reduce((s, e) => s + (e.amountPaid || 0), 0);
  
  // pendingTotal is outstanding unpaid amounts for Pending/Upcoming/Partially Paid
  const pendingTotal = all
    .filter(e => ['Pending', 'Upcoming', 'Partially Paid'].includes(e.paymentStatus))
    .reduce((s, e) => s + (e.amount - (e.amountPaid || 0)), 0);

  // overdueTotal is outstanding unpaid amounts for Overdue
  const overdueTotal = all
    .filter(e => e.paymentStatus === 'Overdue')
    .reduce((s, e) => s + (e.amount - (e.amountPaid || 0)), 0);

  res.status(200).json({
    success: true,
    count: expenses.length,
    summary: {
      paidTotal: Math.round(paidTotal * 100) / 100,
      pendingTotal: Math.round(pendingTotal * 100) / 100,
      overdueTotal: Math.round(overdueTotal * 100) / 100,
      totalCount: all.length,
      paidCount: all.filter(e => e.paymentStatus === 'Paid').length,
      pendingCount: all.filter(e => ['Pending', 'Upcoming'].includes(e.paymentStatus)).length,
      overdueCount: all.filter(e => e.paymentStatus === 'Overdue').length,
      partialCount: all.filter(e => e.paymentStatus === 'Partially Paid').length
    },
    data: expenses
  });
});

/**
 * @desc    Update an expense
 * @route   PUT /api/expenses/:id
 * @access  Private
 */
const updateExpense = asyncHandler(async (req, res) => {
  let expense = await Expense.findOne({ _id: req.params.id, userId: req.user._id });

  if (!expense) {
    return res.status(404).json({
      success: false,
      error: translate(req, 'resource_not_found')
    });
  }

  const updateFields = [
    'amount', 'category', 'description', 'date',
    'dueDate', 'paymentStatus', 'amountPaid', 'paidDate', 'paymentMethod', 'notes'
  ];

  updateFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      expense[field] = req.body[field];
    }
  });

  // Enforce matching amountPaid rules on update
  if (expense.paymentStatus === 'Paid') {
    expense.amountPaid = expense.amount;
  } else if (expense.paymentStatus === 'Partially Paid') {
    if (expense.amountPaid >= expense.amount) {
      expense.paymentStatus = 'Paid';
      expense.amountPaid = expense.amount;
    }
  } else {
    expense.amountPaid = 0;
  }

  // Adjust status dynamically if unpaid
  if (expense.paymentStatus !== 'Paid' && expense.paymentStatus !== 'Partially Paid') {
    if (expense.dueDate) {
      expense.paymentStatus = new Date() > new Date(expense.dueDate) ? 'Overdue' : 'Upcoming';
    } else {
      expense.paymentStatus = 'Pending';
    }
  }

  await expense.save();

  res.status(200).json({
    success: true,
    message: translate(req, 'expense_updated'),
    data: expense
  });
});

/**
 * @desc    Mark an expense as Paid
 * @route   PATCH /api/expenses/:id/mark-paid
 * @access  Private
 */
const markExpensePaid = asyncHandler(async (req, res) => {
  const expense = await Expense.findOne({ _id: req.params.id, userId: req.user._id });

  if (!expense) {
    return res.status(404).json({
      success: false,
      error: translate(req, 'resource_not_found')
    });
  }

  const { paidDate, paymentMethod } = req.body;

  expense.paymentStatus = 'Paid';
  expense.amountPaid = expense.amount; // Fully Paid
  expense.paidDate = paidDate ? new Date(paidDate) : new Date();
  if (paymentMethod) expense.paymentMethod = paymentMethod;

  await expense.save();

  res.status(200).json({
    success: true,
    message: `Expense marked as Paid on ${expense.paidDate.toLocaleDateString()}.`,
    data: expense
  });
});

/**
 * @desc    Delete an expense
 * @route   DELETE /api/expenses/:id
 * @access  Private
 */
const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findOne({ _id: req.params.id, userId: req.user._id });

  if (!expense) {
    return res.status(404).json({
      success: false,
      error: translate(req, 'resource_not_found')
    });
  }

  await expense.deleteOne();

  res.status(200).json({
    success: true,
    message: translate(req, 'expense_deleted')
  });
});

module.exports = {
  addExpense,
  getExpenses,
  updateExpense,
  markExpensePaid,
  deleteExpense
};
