const { body } = require('express-validator');

const CATEGORIES = ['Food', 'Rent', 'Education', 'Healthcare', 'Transport', 'Entertainment', 'Shopping', 'Utilities', 'Other'];
const PAYMENT_METHODS = ['Cash', 'UPI', 'Net Banking', 'Credit Card', 'Debit Card', 'Cheque', 'Auto-Debit', 'Other'];

const expenseValidator = [
  body('amount')
    .notEmpty().withMessage('Expense amount is required')
    .isFloat({ min: 0.01 }).withMessage('Expense amount must be greater than 0'),

  body('category')
    .notEmpty().withMessage('Expense category is required')
    .isIn(CATEGORIES).withMessage('Invalid expense category selection'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Description must not exceed 200 characters'),

  body('paymentStatus')
    .notEmpty().withMessage('Payment status is required')
    .isIn(['Pending', 'Paid']).withMessage('Payment status must be Pending or Paid'),

  body('dueDate')
    .custom((value, { req }) => {
      if (req.body.paymentStatus === 'Pending' && !value) {
        throw new Error('Due date is required when payment status is Pending');
      }
      return true;
    })
    .optional({ nullable: true })
    .isISO8601().withMessage('Due date must be a valid ISO date'),

  body('paidDate')
    .custom((value, { req }) => {
      if (req.body.paymentStatus === 'Paid' && !value) {
        throw new Error('Payment date is required when payment status is Paid');
      }
      return true;
    })
    .optional({ nullable: true })
    .isISO8601().withMessage('Paid date must be a valid ISO date'),

  body('paymentMethod')
    .optional({ nullable: true })
    .isIn(PAYMENT_METHODS).withMessage('Invalid payment method'),

  body('notes')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 300 }).withMessage('Notes must not exceed 300 characters')
];

// Validator for mark-as-paid endpoint
const markPaidValidator = [
  body('paidDate')
    .optional({ nullable: true })
    .isISO8601().withMessage('Paid date must be a valid ISO date'),

  body('paymentMethod')
    .optional({ nullable: true })
    .isIn(PAYMENT_METHODS).withMessage('Invalid payment method')
];

module.exports = { expenseValidator, markPaidValidator, CATEGORIES, PAYMENT_METHODS };
