const Loan = require('../models/Loan');
const FinancialProfile = require('../models/FinancialProfile');
const ForecastService = require('../services/forecastService');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get overall portfolio debt forecast (tenure, interest, accelerated payments)
 * @route   GET /api/forecast
 * @access  Private
 */
const runDebtForecast = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 1. Fetch active loans & profile
  const loans = await Loan.find({ userId, status: 'Active' });
  const profile = await FinancialProfile.findOne({ userId });

  // 2. Compute forecast in backend service
  const forecastResults = ForecastService.generateForecast(loans, profile);

  res.status(200).json({
    success: true,
    data: forecastResults
  });
});

module.exports = {
  runDebtForecast
};
