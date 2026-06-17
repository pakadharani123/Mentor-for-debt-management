const { body } = require('express-validator');

const loanValidator = [
  body('loanName')
    .trim()
    .notEmpty()
    .withMessage('Loan name is required'),
  body('loanType')
    .notEmpty()
    .withMessage('Loan type is required')
    .isIn([
      'Personal Loan',
      'Home Loan',
      'Education Loan',
      'Vehicle Loan',
      'Credit Card Debt',
      'Other'
    ])
    .withMessage('Invalid loan type selection'),
  body('principalAmount')
    .notEmpty()
    .withMessage('Principal amount is required')
    .isFloat({ min: 1 })
    .withMessage('Principal amount must be greater than 0'),
  body('remainingAmount')
    .notEmpty()
    .withMessage('Remaining amount is required')
    .isFloat({ min: 0 })
    .withMessage('Remaining amount cannot be negative'),
  body('interestRate')
    .notEmpty()
    .withMessage('Interest rate is required')
    .isFloat({ min: 0 })
    .withMessage('Interest rate must be a non-negative percentage'),
  body('emi')
    .notEmpty()
    .withMessage('EMI is required')
    .isFloat({ min: 0 })
    .withMessage('EMI must be a non-negative number'),
  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('dueDate')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('Due date must be a valid date')
];

module.exports = {
  loanValidator
};
