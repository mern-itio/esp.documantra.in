const express = require('express');
const verifyJWT  = require('@draftnsign/auth-lib');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const eSignRoutes = require('./routes/eSignRoutes');

dotenv.config();

const app = express(); 

// Middleware
app.use(cors({
  origin: "*"
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static('uploads'));

// DB Connection
connectDB();

// JWT Middleware
app.use(verifyJWT(process.env.ACCESS_TOKEN_SECRET));

// Health check route
app.get('/health', (req, res) => {
  res.send(`E-Sign service is running ${req.user?.data?.fullname || ''}`);
});
// API Routes
app.use('/api/e-sign', eSignRoutes);


// Start server
const PORT = process.env.PORT || 2103;
app.listen(PORT, () => console.log(`E-Sign Service running on ${PORT}/`));
