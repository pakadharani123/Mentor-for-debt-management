const { validationResult } = require('express-validator');
const { translate } = require('../utils/localizer');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  // Format validation errors
  const formattedErrors = errors.array().map((err) => ({
    field: err.path,
    message: err.msg
  }));

  return res.status(400).json({
    success: false,
    error: translate(req, 'bad_request'),
    validationErrors: formattedErrors
  });
};

module.exports = { validate };
