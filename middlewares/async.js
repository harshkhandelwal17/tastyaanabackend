/**
 * Async handler to wrap around async route handlers
 * Catches errors and passes them to Express error handling middleware
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  // Wrap the async function in a Promise to handle both async/await and Promise-based functions
  return Promise.resolve(fn(req, res, next)).catch((err) => {
    // If the error doesn't have a status code, default to 500
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    
    // Log the error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('\x1b[31m%s\x1b[0m', '[ASYNC HANDLER ERROR]', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query,
        user: req.user ? req.user.id : 'unauthenticated'
      });
    }
    
    // Pass the error to the next middleware (error handler)
    next(err);
  });
};

module.exports = asyncHandler;
