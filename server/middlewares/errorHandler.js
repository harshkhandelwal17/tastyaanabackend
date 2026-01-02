// middleware/errorHandler.js
const { 
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  SlotError,
  SlotConflictError,
  SlotUnavailableError,
  InvalidTimeFormatError,
  InvalidDayError
} = require('../utils/errors');

const errorHandler = (err, req, res, next) => {
  // Default error response
  let error = {
    statusCode: err.statusCode || 500,
    message: err.message || 'Internal Server Error',
    status: 'error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  // Handle known error types
  if (err instanceof AppError) {
    error = {
      ...error,
      ...err.toJSON()
    };
  }
  // Handle Mongoose errors
  else if (err.name === 'CastError') {
    error = new NotFoundError('Resource not found', { path: err.path, value: err.value });
  }
  else if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    error = new BadRequestError('Duplicate field value', { [field]: value });
  }
  else if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message,
      value: e.value
    }));
    error = new ValidationError('Validation failed', errors);
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    error = new UnauthorizedError('Invalid token');
  }
  else if (err.name === 'TokenExpiredError') {
    error = new UnauthorizedError('Token expired');
  }
  // Handle file upload errors
  else if (err.code === 'LIMIT_FILE_SIZE') {
    error = new BadRequestError('File too large', { maxSize: '2MB' });
  }
  else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = new BadRequestError('Unexpected file field');
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('\x1b[31m%s\x1b[0m', '[ERROR]', {
      message: error.message,
      statusCode: error.statusCode,
      path: req.path,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query,
      stack: error.stack
    });
  } else {
    // In production, only log the error message and request info
    console.error(`[${new Date().toISOString()}] ${error.statusCode} - ${error.message} - ${req.method} ${req.originalUrl}`);
  }

  // Send error response
  res.status(error.statusCode).json({
    success: false,
    status: error.status,
    message: error.message,
    ...(error.details && { details: error.details }),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

  
  module.exports = errorHandler;
  