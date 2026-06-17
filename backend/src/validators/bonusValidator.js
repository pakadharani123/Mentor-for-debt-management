const { body } = require('express-validator');

const simulatorValidator = [
  body('extraPayment')
    .notEmpty()
    .withMessage('Extra payment amount is required')
    .isFloat({ min: 1 })
    .withMessage('Extra payment must be a positive number'),
  body('paymentType')
    .optional()
    .isIn(['monthly', 'one-time'])
    .withMessage('Payment type must be either monthly or one-time')
];

const savingsGoalValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Goal title is required')
    .isLength({ min: 2 })
    .withMessage('Goal title must be at least 2 characters'),
  body('targetAmount')
    .notEmpty()
    .withMessage('Target savings amount is required')
    .isFloat({ min: 1 })
    .withMessage('Target amount must be a positive number'),
  body('currentAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Current savings amount must be a non-negative number'),
  body('targetDate')
    .notEmpty()
    .withMessage('Target date is required')
    .isISO8601()
    .withMessage('Target date must be a valid date')
];

module.exports = {
  simulatorValidator,
  savingsGoalValidator
};
