const DEFAULT_ALLOWED_ORIGINS = [
  'https://esp.documantra.in',
  'https://esign.documantra.in',
  'https://documantra.in',
  'https://www.documantra.in',
  'https://documantra.com',
  'https://www.documantra.com',
  'https://esign.verasys.in',
  'https://esignuat.vsign.in',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
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
