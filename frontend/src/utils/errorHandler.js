/**
 * Frontend error handling utilities
 * Provides standardized error handling and user-friendly messages
 */

/**
 * Extract error message from various error formats
 * @param {Error|Object} error - Error object or API error response
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error) => {
  // API error response format
  if (error?.response?.data?.error?.message) {
    return error.response.data.error.message;
  }

  // Axios error with custom message
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  // Network error
  if (error?.message === 'Network Error') {
    return 'Unable to connect to the server. Please check your internet connection.';
  }

  // Timeout error
  if (error?.code === 'ECONNABORTED') {
    return 'Request timed out. Please try again.';
  }

  // HTTP status code errors
  if (error?.response?.status) {
    return getStatusMessage(error.response.status);
  }

  // Generic error message
  if (error?.message) {
    return error.message;
  }

  // Fallback
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Get user-friendly message for HTTP status codes
 * @param {number} status - HTTP status code
 * @returns {string} User-friendly message
 */
export const getStatusMessage = (status) => {
  const statusMessages = {
    400: 'Invalid request. Please check your input and try again.',
    401: 'You need to log in to continue.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    409: 'This resource already exists.',
    429: 'Too many requests. Please wait a moment and try again.',
    500: 'Server error. Please try again later.',
    502: 'Server is temporarily unavailable. Please try again later.',
    503: 'Service unavailable. Please try again later.'
  };

  return statusMessages[status] || `Error ${status}: Something went wrong.`;
};

/**
 * Check if error is a network error
 * @param {Error} error - Error object
 * @returns {boolean} True if network error
 */
export const isNetworkError = (error) => {
  return (
    error?.message === 'Network Error' ||
    error?.code === 'ECONNABORTED' ||
    !error?.response
  );
};

/**
 * Check if error is an authentication error
 * @param {Error} error - Error object
 * @returns {boolean} True if auth error
 */
export const isAuthError = (error) => {
  return error?.response?.status === 401;
};

/**
 * Log error to console in development
 * @param {Error} error - Error object
 * @param {string} context - Context where error occurred
 */
export const logError = (error, context = '') => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[Error${context ? ` - ${context}` : ''}]:`, {
      message: getErrorMessage(error),
      details: error,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Handle API errors with automatic logging and user feedback
 * @param {Error} error - Error object
 * @param {string} context - Context where error occurred
 * @returns {Object} Standardized error object
 */
export const handleApiError = (error, context = '') => {
  logError(error, context);

  return {
    message: getErrorMessage(error),
    isNetworkError: isNetworkError(error),
    isAuthError: isAuthError(error),
    statusCode: error?.response?.status,
    details: error?.response?.data?.error?.details
  };
};

/**
 * Retry async function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Initial delay in milliseconds
 * @returns {Promise} Result of function
 */
export const retryWithBackoff = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on auth errors or client errors (4xx)
      if (isAuthError(error) || (error?.response?.status >= 400 && error?.response?.status < 500)) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (i < maxRetries - 1) {
        const waitTime = delay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError;
};

/**
 * Create error boundary handler for React components
 * @param {Function} onError - Callback when error occurs
 * @returns {Function} Error handler function
 */
export const createErrorHandler = (onError) => {
  return (error, context = '') => {
    const handledError = handleApiError(error, context);

    if (onError) {
      onError(handledError);
    }

    // Redirect to login on auth errors
    if (handledError.isAuthError) {
      window.location.href = '/login';
    }

    return handledError;
  };
};
