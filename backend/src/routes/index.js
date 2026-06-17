const express = require('express');

const authRoutes = require('./authRoutes');
const profileRoutes = require('./profileRoutes');
const loanRoutes = require('./loanRoutes');
const expenseRoutes = require('./expenseRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const repaymentRoutes = require('./repaymentRoutes');
const healthRoutes = require('./healthRoutes');
const aiRoutes = require('./aiRoutes');
const bonusRoutes = require('./bonusRoutes');

// New route modules
const simulatorRoutes = require('./simulatorRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const forecastRoutes = require('./forecastRoutes');
const recoveryScoreRoutes = require('./recoveryScoreRoutes');
const adminRoutes = require('./adminRoutes');

const router = express.Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/loans', loanRoutes);
router.use('/expenses', expenseRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/debt-plan', repaymentRoutes);
router.use('/financial-health', healthRoutes); // Kept for legacy support
router.use('/ai', aiRoutes);
router.use('/bonus', bonusRoutes);

// New Feature mounts
router.use('/simulator', simulatorRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/forecast', forecastRoutes);
router.use('/recovery-score', recoveryScoreRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
