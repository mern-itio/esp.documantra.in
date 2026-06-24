const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const helmet = require('helmet');
const { connectDB } = require('./config/db');
const verifyJWT = require('@draftnsign/auth-lib');
const organizationRoutes = require('./routes/organization.routes');
const adminRoutes = require('./routes/adminRoutes');
const app = express();

app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  hsts: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

app.use(cors({
  origin: "*"
}));

connectDB();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static('uploads'));
app.use('/api', verifyJWT());
app.use('/api/organization', organizationRoutes);
app.use('/admin', verifyJWT("admin"),adminRoutes );

const PORT = process.env.PORT || 2111;
app.listen(PORT, () => console.log(`Organization running on ${PORT}/`));
