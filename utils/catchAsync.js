/**
 * Wraps an async function to catch any errors and pass them to Express's error handling middleware
 * @param {Function} fn - The async function to wrap
 * @returns {Function} A new function that handles errors properly
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    // Make sure to `.catch()` any errors and pass them along to the `next()`
    // function in the chain, which will handle the error
    fn(req, res, next).catch(next);
  };
};

module.exports = catchAsync;
