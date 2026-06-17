const express = require('express');
const {
  getAdminDashboard,
  getAdminUsers,
  getAdminFinancialSummary,
  resetAllLoginLocks
} = require('../controllers/adminController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // All routes require valid auth
router.use(isAdmin); // All routes require admin authorization

router.get('/dashboard', getAdminDashboard);
router.get('/users', getAdminUsers);
router.get('/financial-summary', getAdminFinancialSummary);
router.post('/reset-login-locks', resetAllLoginLocks);

module.exports = router;
