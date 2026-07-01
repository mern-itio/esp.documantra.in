const DEFAULT_ALLOWED_ORIGINS = [
  'https://esp.documantra.in',
  'https://esign.documantra.in',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
];

const getAllowedOrigins = () => {
  const raw = process.env.CORS_ALLOWED_ORIGINS;
  if (!raw || !String(raw).trim()) {
    return DEFAULT_ALLOWED_ORIGINS;
  }
  return String(raw)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const getCorsOptions = () => {
  const allowedOrigins = getAllowedOrigins();

  return {
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  };
};

module.exports = {
  getCorsOptions,
  getAllowedOrigins,
};
