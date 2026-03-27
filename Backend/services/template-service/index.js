const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const verifyJWT  = require('@draftnsign/auth-lib');
const cors = require('cors');
const { connectDB } = require('./config/db');
const formBuilderRoutes = require('./routes/formBuilderRoutes');
const publicRoutes = require('./routes/publicRoutes');
const aiContentRoutes = require('./routes/aiContentRoutes');


// Import routes


const app = express();

app.use(cors({
  origin: "*"
}));

connectDB();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// JWT Middleware (applied to API routes only)
// - Admin endpoints under /api/template/admin/* should accept admin tokens
// - Everything else under /api/* uses the regular user token
app.use('/api', (req, res, next) => {
  const isAdminTemplateRoute = req.path.startsWith('/template/admin');
  if (isAdminTemplateRoute) {
    // Internal service-to-service calls can authenticate using x-internal-key
    const internalKey = String(req.headers['x-internal-key'] || '').trim();
    const expected = String(process.env.INTERNAL_ADMIN_API_KEY || process.env.ADMIN_ACCESS_TOKEN_SECRET || '').trim();
    if (expected && internalKey && internalKey === expected) {
      req.user = req.user || { type: 'admin', role: 'admin' };
      req.userType = 'admin';
      return next();
    }
    return verifyJWT('admin')(req, res, next);
  }
  return verifyJWT()(req, res, next);
});
app.use('/api/template',formBuilderRoutes);
app.use('/public/template',publicRoutes);
app.use('/public/ai-content', aiContentRoutes); // Public route for AI content generation
app.get('/health', (req, res) => {
  res.send(`Template service is running ${req.user?.data?.fullname || ''}`);
});
// API Routes

const PORT = process.env.PORT || 2106;
app.listen(PORT, () => console.log(`Template running on ${PORT}/`));
