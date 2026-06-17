const express = require('express');
const {
  addLoan,
  getLoans,
  getLoanById,
  updateLoan,
  deleteLoan
} = require('../controllers/loanController');
const { loanValidator } = require('../validators/loanValidator');
const { validate } = require('../middleware/validatorMiddleware');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // All loan routes are protected

router.post('/', loanValidator, validate, addLoan);
router.get('/', getLoans);
router.get('/:id', getLoanById);
router.put('/:id', loanValidator, validate, updateLoan);
router.delete('/:id', deleteLoan);

module.exports = router;
