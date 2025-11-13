const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const { connectDB } = require('./src/config/db');
const verifyJWT = require('@draftnsign/auth-lib');
const plansRoutes = require('./src/routes/plansRoutes');
const userPlanRoutes = require('./src/routes/userPlanRoutes');
const toolSettingsRoutes = require('./src/routes/toolSettingsRoutes');
const authProviderRoutes = require('./src/routes/authProviderRoutes');
const { createFreePlanForUser } = require('./src/controllers/userPlanController');
const usageRoutes = require('./src/routes/usageRoutes');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
connectDB();

// Admin routes (protected)
app.use('/admin', verifyJWT('admin'));
app.use('/admin/plan-templates', plansRoutes);
app.use('/admin', toolSettingsRoutes);
app.use('/admin/auth-providers', authProviderRoutes);
const userAuthProviderRoutes = require('./src/routes/userAuthProviderRoutes');
// Internal route used by auth-service to create free plan (no auth)
app.post('/user-plan/create-free', createFreePlanForUser);

// Public route for listing plans (no auth required) - for landing page pricing
const { listPlans } = require('./src/controllers/plansController');
app.get('/user-plan/public/all', listPlans);

// User plan routes - require user token
app.use('/user-plan', verifyJWT('user'));
app.use('/user-plan', userPlanRoutes);

// Usage routes - require user token
app.use('/usage', verifyJWT('user'));
app.use('/usage', usageRoutes);

// User authProvider routes - require user token
app.use('/user', verifyJWT('user'));
app.use('/user', userAuthProviderRoutes);


const PORT = process.env.PORT || 2110;
app.listen(PORT, () => console.log(`Subscription service running on ${PORT}`));


