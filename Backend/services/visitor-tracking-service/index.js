const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { getPool } = require('./config/db');
const trackRoutes = require('./routes/trackRoutes');
const internalRoutes = require('./routes/internalRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { runRetentionCleanup } = require('./jobs/retentionCleanup');

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));

const origins = String(process.env.TRACKING_CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (!origins.length || origins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: false,
  }),
);

app.use(express.json({ limit: '256kb' }));

app.get('/health', async (_req, res) => {
  try {
    await getPool().query('SELECT 1');
    return res.status(200).json({ status: 'ok', service: 'visitor-tracking' });
  } catch (err) {
    return res.status(503).json({ status: 'degraded', error: err.message });
  }
});

app.use('/track', trackRoutes);
app.use('/internal', internalRoutes);
app.use('/admin', adminRoutes);

app.use((err, _req, res, _next) => {
  console.error('[visitor-tracking] unhandled', err);
  res.status(500).json({ status: 500, message: 'Internal error' });
});

const PORT = Number(process.env.PORT || 2116);

async function start() {
  try {
    await getPool().query('SELECT 1');
    console.log('[visitor-tracking] postgres connected');
  } catch (err) {
    console.error('[visitor-tracking] postgres not ready yet:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`[visitor-tracking] listening on ${PORT}`);
  });

  const cronMs = Number(process.env.RETENTION_CRON_MS || 86400000);
  if (cronMs > 0) {
    setTimeout(() => {
      runRetentionCleanup().catch((e) => console.error(e.message));
      setInterval(() => {
        runRetentionCleanup().catch((e) => console.error(e.message));
      }, cronMs);
    }, 60 * 1000);
  }
}

start();
