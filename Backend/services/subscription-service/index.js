const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const { connectDB } = require('./src/config/db');
const verifyJWT = require('@draftnsign/auth-lib');
const plansRoutes = require('./src/routes/plansRoutes');
const publicPlansRoutes = require('./src/routes/publicPlansRoutes');
const subscriptionsRoutes = require('./src/routes/subscriptionsRoutes');
const toolSettingsRoutes = require('./src/routes/toolSettingsRoutes');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
connectDB();

// Admin routes (protected)
app.use('/admin', verifyJWT('admin'));
app.use('/admin/plan-templates', plansRoutes);
app.use('/admin', toolSettingsRoutes);
// Public plan info (no auth)
app.use('/public/plans', publicPlansRoutes);

// User subscription routes (protected user)
app.use('/subscriptions', verifyJWT('user'));
app.use('/subscriptions', subscriptionsRoutes);

const PORT = process.env.PORT || 2110;
app.listen(PORT, () => console.log(`Subscription service running on ${PORT}`));


