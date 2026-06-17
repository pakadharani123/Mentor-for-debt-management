const { translate } = require('../utils/localizer');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log for developer
  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = translate(req, 'resource_not_found');
    return res.status(404).json({ success: false, error: message });
  }

  // Mongoose duplicate key error (e.g. unique email check)
  if (err.code === 11000) {
    const message = translate(req, 'email_exists');
    return res.status(400).json({ success: false, error: message });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message).join(', ');
    return res.status(400).json({ success: false, error: message });
  }

  // Default server error
  const status = error.statusCode || 500;
  const errMsg = status === 500 ? translate(req, 'server_error') : error.message;

  res.status(status).json({
    success: false,
    error: errMsg
  });
};

module.exports = errorHandler;
