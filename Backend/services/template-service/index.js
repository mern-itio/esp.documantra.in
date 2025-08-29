const express = require('express');
const verifyJWT  = require('@draftnsign/auth-lib');
const dotenv = require('dotenv');
const cors = require('cors');
const { connectDB } = require('./config/db');
const formBuilderRoutes = require('./routes/formBuilderRoutes');

dotenv.config();
// Import routes


const app = express();

app.use(cors({
  origin: "*"
}));

connectDB();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// JWT Middleware (applied to API routes only)
app.use('/api', verifyJWT(process.env.ACCESS_TOKEN_SECRET));
app.use('/api/template',formBuilderRoutes);
app.get('/health', (req, res) => {
  res.send(`Template service is running ${req.user?.data?.fullname || ''}`);
});
// API Routes

const PORT = process.env.PORT || 2106;
app.listen(PORT, () => console.log(`Auth running on ${PORT}/`));
