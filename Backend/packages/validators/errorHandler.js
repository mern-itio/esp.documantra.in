const isProduction = () =>
  process.env.NODE_ENV === 'production' || process.env.HIDE_ERROR_DETAILS === 'true';

const createErrorHandler = (serviceName = 'Service') => {
  // eslint-disable-next-line no-unused-vars
  return (err, req, res, next) => {
    if (err && err.message === 'Not allowed by CORS') {
      return res.status(403).json({
        success: false,
        message: 'Origin not allowed',
      });
    }

    console.error(`[${serviceName}]`, err);

    const status = err.status || err.statusCode || 500;
    const response = {
      success: false,
      message: isProduction()
        ? 'An unexpected error occurred. Please try again later.'
        : err.message || 'Internal server error',
    };

    if (!isProduction() && err.stack) {
      response.stack = err.stack;
    }

    return res.status(status).json(response);
  };
};

module.exports = {
  createErrorHandler,
};
