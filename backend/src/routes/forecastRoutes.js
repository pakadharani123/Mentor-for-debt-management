const express = require('express');
const { runDebtForecast } = require('../controllers/forecastController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, runDebtForecast);

module.exports = router;
