const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');

// Catches requests that did not match any route
const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

// Centralized error handler: every error in the app ends up here
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details;

  // Mongoose schema validation failures
  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = 'Validation failed';
    details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Invalid ObjectId or wrong data type for a field
  else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid value for '${err.path}': ${err.value}`;
  }

  // Duplicate key (e.g., SKU already exists)
  else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : '';
    message = `Duplicate value for '${field}': ${value}`;
  }

  // Malformed JSON body
  else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Malformed JSON in request body';
  }

  if (statusCode === 500) {
    console.error('Unhandled error:', err);
  }

  const body = {
    success: false,
    message,
  };

  if (details) body.details = details;
  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    body.stack = err.stack;
  }

  res.status(statusCode).json(body);
};

module.exports = { notFound, errorHandler };
