const express = require('express');
const { runEmiSimulation } = require('../controllers/simulatorController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, runEmiSimulation);

module.exports = router;
