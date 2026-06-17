const { body } = require('express-validator');

const profileValidator = [
  body('monthlyIncome')
    .notEmpty()
    .withMessage('Monthly income is required')
    .isFloat({ min: 0 })
    .withMessage('Monthly income must be a non-negative number'),
  body('monthlyExpenses')
    .notEmpty()
    .withMessage('Monthly expenses are required')
    .isFloat({ min: 0 })
    .withMessage('Monthly expenses must be a non-negative number'),
  body('savings')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Savings must be a non-negative number'),
  body('dependents')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Dependents must be a non-negative integer'),
  body('emergencyFund')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Emergency fund must be a non-negative number'),
  body('preferredLanguage')
    .optional()
    .isIn(['en', 'te', 'hi', 'ta'])
    .withMessage('Preferred language must be en, te, hi, or ta'),
  body('riskPreference')
    .optional()
    .isIn(['Low', 'Medium', 'High'])
    .withMessage('Risk preference must be Low, Medium, or High'),
  body('employmentType')
    .optional()
    .isString()
    .withMessage('Employment type must be a string'),
  body('salaryDate')
    .optional()
    .isInt({ min: 1, max: 31 })
    .withMessage('Salary date must be a number between 1 and 31'),
  body('financialGoals')
    .optional()
    .isString()
    .withMessage('Financial goals must be a string'),
  body('reason')
    .optional()
    .isString()
    .withMessage('Update reason must be a string')
];

module.exports = {
  profileValidator
};
