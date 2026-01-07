// Simple centralized error handler
module.exports = function errorHandler(err, req, res, next) {
  // eslint-disable-line no-unused-vars
  console.error(err);
  if (res.headersSent) return;
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || "Internal server error"
  });
};

