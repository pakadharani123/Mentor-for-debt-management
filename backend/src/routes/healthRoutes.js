const express = require('express');
const { getFinancialHealth } = require('../controllers/healthController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getFinancialHealth);

module.exports = router;
