const express = require('express');
const { getDebtPlan } = require('../controllers/repaymentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getDebtPlan);

module.exports = router;
