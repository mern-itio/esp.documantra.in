const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const { connectDB } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const verifyJWT = require('@draftnsign/auth-lib');
const { httpsSecurityMiddleware } = require('./middleware/httpsSecurity');


const app = express();

app.set('trust proxy', 1);
app.use(httpsSecurityMiddleware);

app.use(cors({
  origin: "*"
}));

connectDB();

app.use(express.json());
app.use('/api-admin', verifyJWT('admin'));
app.use('/', authRoutes);
app.use('/api-admin', adminRoutes);

const PORT = process.env.PORT || 2101;
app.listen(PORT, () => console.log(`Auth running on ${PORT}/`));
