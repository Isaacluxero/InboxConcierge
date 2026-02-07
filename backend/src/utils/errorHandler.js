import logger from './logger.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../config/constants.js';

/**
 * Custom application error class
 * Extends Error with additional context for API errors
 */
export class AppError extends Error {
  constructor(message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Standardized error response format
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @returns {Object} Formatted error response
 */
export const formatErrorResponse = (error, req = null) => {
  const response = {
    success: false,
    error: {
      message: error.message || ERROR_MESSAGES.SERVER_ERROR,
      statusCode: error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
    }
  };

  // Include details in development mode
  if (process.env.NODE_ENV !== 'production' && error.details) {
    response.error.details = error.details;
  }

  // Include stack trace in development mode
  if (process.env.NODE_ENV !== 'production' && error.stack) {
    response.error.stack = error.stack;
  }

  // Include request ID for tracking (if available)
  if (req?.id) {
    response.error.requestId = req.id;
  }

  return response;
};

/**
 * Log error with context
 * @param {Error} error - Error object
 * @param {Object} context - Additional context (req, user, etc.)
 */
export const logError = (error, context = {}) => {
  const logData = {
    message: error.message,
    statusCode: error.statusCode,
    stack: error.stack,
    ...context
  };

  // Log based on severity
  if (error.statusCode >= 500) {
    logger.error('[ErrorHandler] Server Error:', logData);
  } else if (error.statusCode >= 400) {
    logger.warn('[ErrorHandler] Client Error:', logData);
  } else {
    logger.info('[ErrorHandler] Info:', logData);
  }
};

/**
 * Async error wrapper for route handlers
 * Catches async errors and passes them to error middleware
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped function
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Handle specific error types and convert to AppError
 * @param {Error} error - Original error
 * @returns {AppError} Standardized AppError
 */
export const normalizeError = (error) => {
  // Prisma errors
  if (error.code === 'P2002') {
    return new AppError(
      'A record with this value already exists',
      HTTP_STATUS.CONFLICT,
      { field: error.meta?.target }
    );
  }

  if (error.code === 'P2025') {
    return new AppError(
      ERROR_MESSAGES.NOT_FOUND,
      HTTP_STATUS.NOT_FOUND
    );
  }

  // Validation errors
  if (error.name === 'ValidationError') {
    return new AppError(
      ERROR_MESSAGES.INVALID_INPUT,
      HTTP_STATUS.BAD_REQUEST,
      { validationErrors: error.errors }
    );
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return new AppError(
      ERROR_MESSAGES.UNAUTHORIZED,
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  if (error.name === 'TokenExpiredError') {
    return new AppError(
      'Session expired, please login again',
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  // Gmail API errors
  if (error.code === 429) {
    return new AppError(
      ERROR_MESSAGES.RATE_LIMITED,
      HTTP_STATUS.TOO_MANY_REQUESTS
    );
  }

  // OpenAI API errors
  if (error.response?.status === 429) {
    return new AppError(
      'AI service rate limit exceeded, please try again later',
      HTTP_STATUS.TOO_MANY_REQUESTS
    );
  }

  // Already an AppError
  if (error instanceof AppError) {
    return error;
  }

  // Unknown error - return as 500
  return new AppError(
    process.env.NODE_ENV === 'production'
      ? ERROR_MESSAGES.SERVER_ERROR
      : error.message,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    process.env.NODE_ENV !== 'production' ? { originalError: error.message } : null
  );
};

/**
 * Express error handling middleware
 * Must be used as the last middleware in the chain
 */
export const errorMiddleware = (error, req, res, next) => {
  // Normalize error to AppError
  const normalizedError = normalizeError(error);

  // Log error with context
  logError(normalizedError, {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id
  });

  // Send error response
  const response = formatErrorResponse(normalizedError, req);
  res.status(normalizedError.statusCode).json(response);
};

/**
 * Handle unhandled promise rejections
 */
export const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('[ErrorHandler] Unhandled Rejection:', {
      reason,
      promise
    });
    // Don't exit in production - log and continue
    if (process.env.NODE_ENV !== 'production') {
      throw reason;
    }
  });
};

/**
 * Handle uncaught exceptions
 */
export const handleUncaughtException = () => {
  process.on('uncaughtException', (error) => {
    logger.error('[ErrorHandler] Uncaught Exception:', {
      message: error.message,
      stack: error.stack
    });
    // Exit process on uncaught exception
    process.exit(1);
  });
};
