const rateLimit = require('express-rate-limit');
const { translate } = require('../utils/localizer');

const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 250, // Limit each IP to 250 requests per windowMs
  handler: (req, res) => {
    console.warn(`[Rate Limit Exceeded] standardLimiter - IP: ${req.ip}, Path: ${req.originalUrl}`);
    res.status(429).json({
      success: false,
      error: translate(req, 'rate_limit_exceeded')
    });
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // Limit registration/login to 150 per windowMs
  handler: (req, res) => {
    console.warn(`[Rate Limit Exceeded] authLimiter - IP: ${req.ip}, Path: ${req.originalUrl}`);
    res.status(429).json({
      success: false,
      error: translate(req, 'rate_limit_exceeded')
    });
  }
});



module.exports = {
  standardLimiter,
  authLimiter
};
