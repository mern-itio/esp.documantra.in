const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');

// Sanitize input to prevent NoSQL injection
const sanitizeInput = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`Sanitized ${key} in request`);
  }
});

// XSS sanitization function
const sanitizeXSS = (str) => {
  if (typeof str !== 'string') return str;
  return xss(str, {
    whiteList: {}, // No tags allowed
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script']
  });
};

// Middleware to sanitize request body
const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeXSS(req.body[key]);
      }
    });
  }
  next();
};

module.exports = {
  sanitizeInput,
  sanitizeBody,
  sanitizeXSS
};

