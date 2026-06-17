const express = require('express');
const { getRecoveryScore } = require('../controllers/recoveryScoreController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getRecoveryScore);

module.exports = router;
