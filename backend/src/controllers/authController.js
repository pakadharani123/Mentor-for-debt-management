const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');
const asyncHandler = require('../utils/asyncHandler');
const { translate } = require('../utils/localizer');

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: config.jwtExpire
  });
};

/**
 * @desc    Register user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, preferredLanguage } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({
      success: false,
      error: translate(req, 'email_exists')
    });
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    preferredLanguage: preferredLanguage || 'en'
  });

  if (user) {
    res.status(201).json({
      success: true,
      message: translate(req, 'register_success'),
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferredLanguage: user.preferredLanguage
      }
    });
  } else {
    res.status(400).json({
      success: false,
      error: translate(req, 'bad_request')
    });
  }
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // 1. Check database connectivity status
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 1) {
    console.error(`[Auth Diagnostics] Login failed for ${email || 'unknown'} from IP ${req.ip} - MongoDB readyState: ${mongoose.connection.readyState} (Disconnected)`);
    return res.status(503).json({
      success: false,
      error: 'Unable to connect to database.'
    });
  }

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: translate(req, 'bad_request')
    });
  }

  const cleanEmail = email.toLowerCase().trim();

  // 2. Fetch user including select: false parameters
  const user = await User.findOne({ email: cleanEmail }).select('+password +loginAttempts +lockUntil');
  
  if (!user) {
    console.warn(`[Auth Diagnostics] Login failed for ${cleanEmail} from IP ${req.ip} - Reason: Email not registered.`);
    return res.status(401).json({
      success: false,
      error: translate(req, 'invalid_credentials')
    });
  }

  // 3. Define rate limiting variables by environment
  const isDev = process.env.NODE_ENV === 'development';
  const MAX_ATTEMPTS = isDev ? 20 : 5;
  const COOLDOWN_TIME = isDev ? 30 * 1000 : 60 * 1000;

  // 4. Verify lockout status
  if (user.lockUntil && user.lockUntil > Date.now()) {
    const remainingTime = Math.ceil((user.lockUntil.getTime() - Date.now()) / 1000);
    console.warn(`[Auth Diagnostics] Login blocked for ${cleanEmail} from IP ${req.ip} - Reason: Locked. Cooldown remaining: ${remainingTime}s`);
    return res.status(429).json({
      success: false,
      error: `Too many failed login attempts. Please wait ${remainingTime} seconds before trying again.`,
      cooldownRemaining: remainingTime,
      lockUntil: user.lockUntil
    });
  }

  // 5. Automatic unlock if cooldown has expired
  if (user.lockUntil && user.lockUntil <= Date.now()) {
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();
  }

  // 6. Check password match
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    user.loginAttempts += 1;
    let lockStatus = false;
    let remainingCooldown = 0;

    if (user.loginAttempts >= MAX_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + COOLDOWN_TIME);
      lockStatus = true;
      remainingCooldown = COOLDOWN_TIME / 1000;
      console.warn(`[Auth Diagnostics] Login failed for ${cleanEmail} from IP ${req.ip} - Attempts: ${user.loginAttempts}/${MAX_ATTEMPTS}. Account LOCKED for ${remainingCooldown}s.`);
    } else {
      console.warn(`[Auth Diagnostics] Login failed for ${cleanEmail} from IP ${req.ip} - Attempts: ${user.loginAttempts}/${MAX_ATTEMPTS}. Reason: Password mismatch.`);
    }

    await user.save();

    if (lockStatus) {
      return res.status(429).json({
        success: false,
        error: `Too many failed login attempts. Please wait ${remainingCooldown} seconds before trying again.`,
        cooldownRemaining: remainingCooldown,
        lockUntil: user.lockUntil
      });
    }

    return res.status(401).json({
      success: false,
      error: translate(req, 'invalid_credentials')
    });
  }

  // 7. Successful login resets failure count
  user.loginAttempts = 0;
  user.lockUntil = null;
  await user.save();

  console.info(`[Auth Diagnostics] Login successful for ${cleanEmail} from IP ${req.ip}. Attempts count reset to 0.`);

  res.status(200).json({
    success: true,
    message: translate(req, 'auth_success'),
    token: generateToken(user._id),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      preferredLanguage: user.preferredLanguage
    }
  });
});

/**
 * @desc    Get user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
const getProfile = asyncHandler(async (req, res) => {
  // req.user is loaded in protect middleware
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      preferredLanguage: user.preferredLanguage,
      createdAt: user.createdAt
    }
  });
});

module.exports = {
  register,
  login,
  getProfile
};
