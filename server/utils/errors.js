// utils/errors.js

class AppError extends Error {
  constructor(message, statusCode = 500, details = {}) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.details = details;
    this.name = this.constructor.name;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      status: this.status,
      statusCode: this.statusCode,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack })
    };
  }
}

class BadRequestError extends AppError {
  constructor(message = 'Bad request', details = {}) {
    super(message, 400, details);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', details = {}) {
    super(message, 401, details);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', details = {}) {
    super(message, 403, details);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details = {}) {
    super(message, 404, details);
  }
}

class ValidationError extends BadRequestError {
  constructor(message = 'Validation failed', errors = []) {
    super(message, { errors });
  }
}

class SlotError extends AppError {
  constructor(message = 'Slot error', statusCode = 400, details = {}) {
    super(message, statusCode, details);
  }
}

class SlotConflictError extends SlotError {
  constructor(message = 'Slot conflict', details = {}) {
    super(message, 409, details);
  }
}

class SlotUnavailableError extends SlotError {
  constructor(message = 'Slot unavailable', details = {}) {
    super(message, 423, details); // 423 Locked
  }
}

class InvalidTimeFormatError extends ValidationError {
  constructor(message = 'Invalid time format. Please use HH:MM format', details = {}) {
    super(message, details);
  }
}

class InvalidDayError extends ValidationError {
  constructor(message = 'Invalid day of week. Must be a number between 0 (Sunday) and 6 (Saturday)', details = {}) {
    super(message, details);
  }
}

module.exports = {
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
};
