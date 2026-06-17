const FinancialProfile = require('../models/FinancialProfile');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { translate } = require('../utils/localizer');

/**
 * @desc    Create User Financial Profile
 * @route   POST /api/profile
 * @access  Private
 */
const createProfile = asyncHandler(async (req, res) => {
  const { 
    monthlyIncome, 
    monthlyExpenses, 
    savings, 
    dependents, 
    emergencyFund, 
    preferredLanguage,
    riskPreference,
    employmentType,
    salaryDate,
    financialGoals
  } = req.body;
  const userId = req.user._id;

  // Check if profile already exists
  let profile = await FinancialProfile.findOne({ userId });
  if (profile) {
    return res.status(400).json({
      success: false,
      error: 'Financial profile already exists.'
    });
  }

  // Update preferredLanguage if specified
  if (preferredLanguage !== undefined) {
    const user = await User.findById(userId);
    if (user) {
      user.preferredLanguage = preferredLanguage;
      await user.save();
    }
  }

  profile = await FinancialProfile.create({
    userId,
    monthlyIncome,
    monthlyExpenses,
    savings: savings || 0,
    dependents: dependents || 0,
    emergencyFund: emergencyFund || 0,
    riskPreference: riskPreference || 'Medium',
    employmentType: employmentType || 'Salaried',
    salaryDate: salaryDate || 1,
    financialGoals: financialGoals || ''
  });

  const responseData = profile.toObject();
  const user = await User.findById(userId);
  if (user) {
    responseData.preferredLanguage = user.preferredLanguage || 'en';
  }

  res.status(201).json({
    success: true,
    message: translate(req, 'profile_created'),
    data: responseData
  });
});

/**
 * @desc    Get User Financial Profile
 * @route   GET /api/profile
 * @access  Private
 */
const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const profile = await FinancialProfile.findOne({ userId }).lean();

  if (!profile) {
    return res.status(404).json({
      success: false,
      error: translate(req, 'profile_not_found')
    });
  }

  const user = await User.findById(userId);
  if (user) {
    profile.preferredLanguage = user.preferredLanguage || 'en';
  }

  res.status(200).json({
    success: true,
    data: profile
  });
});

/**
 * @desc    Update User Financial Profile
 * @route   PUT /api/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { 
    monthlyIncome, 
    monthlyExpenses, 
    savings, 
    dependents, 
    emergencyFund, 
    preferredLanguage,
    riskPreference,
    employmentType,
    salaryDate,
    financialGoals,
    reason
  } = req.body;

  let profile = await FinancialProfile.findOne({ userId });
  if (!profile) {
    return res.status(404).json({
      success: false,
      error: translate(req, 'profile_not_found')
    });
  }

  // Update preferredLanguage if it changed
  if (preferredLanguage !== undefined) {
    const user = await User.findById(userId);
    if (user && user.preferredLanguage !== preferredLanguage) {
      user.preferredLanguage = preferredLanguage;
      await user.save();
    }
  }

  // Check audit changes for all fields
  const changedBy = req.user.name || 'User';
  const effectiveReason = reason || 'Profile update';
  const now = new Date();

  const updates = [
    { name: 'monthlyIncome', label: 'Income', val: monthlyIncome, parse: parseFloat },
    { name: 'monthlyExpenses', label: 'Expenses', val: monthlyExpenses, parse: parseFloat },
    { name: 'savings', label: 'Savings', val: savings, parse: parseFloat },
    { name: 'emergencyFund', label: 'Emergency Fund', val: emergencyFund, parse: parseFloat },
    { name: 'dependents', label: 'Dependents', val: dependents, parse: parseInt },
    { name: 'riskPreference', label: 'Risk Preference', val: riskPreference, parse: v => v },
    { name: 'employmentType', label: 'Employment Type', val: employmentType, parse: v => v },
    { name: 'salaryDate', label: 'Salary Date', val: salaryDate, parse: parseInt },
    { name: 'financialGoals', label: 'Financial Goals', val: financialGoals, parse: v => v }
  ];

  updates.forEach(({ name, label, val, parse }) => {
    if (val !== undefined && val !== null) {
      const parsedVal = parse(val);
      if (profile[name] !== parsedVal) {
        profile.auditTrail.push({
          field: label,
          previousValue: profile[name],
          newValue: parsedVal,
          changedBy,
          reason: effectiveReason,
          updatedAt: now
        });
        profile[name] = parsedVal;
      }
    }
  });

  await profile.save();

  // Return full profile including preferredLanguage
  const updatedProfile = profile.toObject();
  const user = await User.findById(userId);
  if (user) {
    updatedProfile.preferredLanguage = user.preferredLanguage || 'en';
  }

  res.status(200).json({
    success: true,
    message: translate(req, 'profile_updated'),
    data: updatedProfile
  });
});

module.exports = {
  createProfile,
  getProfile,
  updateProfile
};
