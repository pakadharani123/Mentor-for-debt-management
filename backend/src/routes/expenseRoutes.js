const express = require('express');
const {
  addExpense,
  getExpenses,
  updateExpense,
  markExpensePaid,
  deleteExpense
} = require('../controllers/expenseController');
const { expenseValidator, markPaidValidator } = require('../validators/expenseValidator');
const { validate } = require('../middleware/validatorMiddleware');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // All expense routes are protected

router.post('/', expenseValidator, validate, addExpense);
router.get('/', getExpenses);
router.put('/:id', expenseValidator, validate, updateExpense);
router.patch('/:id/mark-paid', markPaidValidator, validate, markExpensePaid);
router.delete('/:id', deleteExpense);

module.exports = router;
