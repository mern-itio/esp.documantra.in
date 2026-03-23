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
const invoiceRoutes = require('./src/routes/invoiceRoutes');
const { createFreePlanForUser } = require('./src/controllers/userPlanController');
const usageRoutes = require('./src/routes/usageRoutes');
const userAuthProviderRoutes = require('./src/routes/userAuthProviderRoutes');
const authProviderOpenRoutes = require('./src/routes/authProviderOpenRoutes');
const creditPackageRoutes = require('./src/routes/creditPackagesRoutes');//Admin
const userCreditPackageRoutes = require('./src/routes/userCreditPackagesRoutes');//User
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
connectDB();

// Admin routes (protected)
app.use('/admin', verifyJWT('admin'));
app.use('/admin/plan-templates', plansRoutes);
app.use('/admin/credit-packages', creditPackageRoutes);
app.use('/admin', toolSettingsRoutes);
app.use('/admin/auth-providers', authProviderRoutes);
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

// Invoice routes - require user token
app.use('/invoices', verifyJWT('user'));
app.use('/invoices', invoiceRoutes);

// User authProvider routes - require user token
app.use('/user', verifyJWT('user'));
app.use('/user', userAuthProviderRoutes);
app.use('/user/credit-packages', userCreditPackageRoutes);

//Authprovider callback routes - no auth required
app.use('/api/authproviders',authProviderOpenRoutes);


const PORT = process.env.PORT || 2110;
app.listen(PORT, () => console.log(`Subscription service running on ${PORT}`));


