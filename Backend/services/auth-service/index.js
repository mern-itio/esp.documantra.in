const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const { getCorsOptions, createErrorHandler, applySecurityHeaders } = require('@draftnsign/validators');
const { connectDB } = require('./config/db');
const { refreshSessionPolicyCache } = require('./utils/sessionPolicy');
const { refreshFederatedLoginCache } = require('./utils/federatedLoginPolicy');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const verifyJWT = require('@draftnsign/auth-lib');
const { httpsSecurityMiddleware } = require('./middleware/httpsSecurity');
const { optionsGuard } = require('./middleware/optionsGuard');


const app = express();

app.set('trust proxy', 1);
app.use(httpsSecurityMiddleware);
applySecurityHeaders(app);

// OPTIONS guard before cors — blocks /login enumeration (VAPT CWE-346)
app.use(optionsGuard);
app.use(cors(getCorsOptions()));

connectDB().then(() => Promise.all([refreshSessionPolicyCache(), refreshFederatedLoginCache()]));

app.use(express.json());
app.use('/api-admin', verifyJWT('admin'));
app.use('/', authRoutes);
app.use('/api-admin', adminRoutes);

app.use(createErrorHandler('Auth'));

const PORT = process.env.PORT || 2101;
app.listen(PORT, () => console.log(`Auth running on ${PORT}/`));
