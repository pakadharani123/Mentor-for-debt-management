const Loan = require('../models/Loan');
const SimulatorService = require('../services/simulatorService');
const asyncHandler = require('../utils/asyncHandler');
const { translate } = require('../utils/localizer');

/**
 * @desc    Simulate loan payoff comparison with current vs proposed EMI
 * @route   POST /api/simulator
 * @access  Private
 */
const runEmiSimulation = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { loanId, currentEmi, proposedEmi } = req.body;

  // 1. Fetch loan
  const loan = await Loan.findOne({ _id: loanId, userId });
  if (!loan) {
    return res.status(404).json({
      success: false,
      error: translate(req, 'resource_not_found')
    });
  }

  // 2. Execute simulation calculations in backend service
  const results = SimulatorService.simulateProposedEmi(loan, currentEmi, proposedEmi);

  if (results.error) {
    return res.status(400).json({
      success: false,
      error: results.error
    });
  }

  res.status(200).json({
    success: true,
    data: {
      currentPayoffMonths: results.currentPayoffMonths,
      newPayoffMonths: results.newPayoffMonths,
      monthsReduced: results.monthsReduced,
      interestSaved: results.interestSaved,
      newPayoffDate: results.newPayoffDate
    }
  });
});

module.exports = {
  runEmiSimulation
};
