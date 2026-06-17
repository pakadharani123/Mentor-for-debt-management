const Loan = require('../models/Loan');
const asyncHandler = require('../utils/asyncHandler');
const { translate } = require('../utils/localizer');

/**
 * @desc    Add a loan
 * @route   POST /api/loans
 * @access  Private
 */
const addLoan = asyncHandler(async (req, res) => {
  const {
    loanName,
    loanType,
    principalAmount,
    remainingAmount,
    interestRate,
    emi,
    startDate,
    dueDate
  } = req.body;

  const loan = await Loan.create({
    userId: req.user._id,
    loanName,
    loanType,
    principalAmount,
    remainingAmount,
    interestRate,
    emi,
    startDate,
    dueDate
  });

  res.status(201).json({
    success: true,
    message: translate(req, 'loan_created', { name: loanName }),
    data: loan
  });
});

/**
 * @desc    Get all loans for current user
 * @route   GET /api/loans
 * @access  Private
 */
const getLoans = asyncHandler(async (req, res) => {
  const loans = await Loan.find({ userId: req.user._id }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: loans.length,
    data: loans
  });
});

/**
 * @desc    Get a single loan details
 * @route   GET /api/loans/:id
 * @access  Private
 */
const getLoanById = asyncHandler(async (req, res) => {
  const loan = await Loan.findOne({ _id: req.params.id, userId: req.user._id });

  if (!loan) {
    return res.status(404).json({
      success: false,
      error: translate(req, 'resource_not_found')
    });
  }

  res.status(200).json({
    success: true,
    data: loan
  });
});

/**
 * @desc    Update a loan details
 * @route   PUT /api/loans/:id
 * @access  Private
 */
const updateLoan = asyncHandler(async (req, res) => {
  let loan = await Loan.findOne({ _id: req.params.id, userId: req.user._id });

  if (!loan) {
    return res.status(404).json({
      success: false,
      error: translate(req, 'resource_not_found')
    });
  }

  // Update properties
  const updateFields = [
    'loanName',
    'loanType',
    'principalAmount',
    'remainingAmount',
    'interestRate',
    'emi',
    'startDate',
    'dueDate',
    'status'
  ];

  updateFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      loan[field] = req.body[field];
    }
  });

  await loan.save();

  res.status(200).json({
    success: true,
    message: translate(req, 'loan_updated'),
    data: loan
  });
});

/**
 * @desc    Delete a loan
 * @route   DELETE /api/loans/:id
 * @access  Private
 */
const deleteLoan = asyncHandler(async (req, res) => {
  const loan = await Loan.findOne({ _id: req.params.id, userId: req.user._id });

  if (!loan) {
    return res.status(404).json({
      success: false,
      error: translate(req, 'resource_not_found')
    });
  }

  await loan.deleteOne();

  res.status(200).json({
    success: true,
    message: translate(req, 'loan_deleted')
  });
});

module.exports = {
  addLoan,
  getLoans,
  getLoanById,
  updateLoan,
  deleteLoan
};
