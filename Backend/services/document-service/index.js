const express = require('express');
const verifyJWT  = require('@draftnsign/auth-lib');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: "*"
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// DB Connection
connectDB();

// JWT Middleware
app.use(verifyJWT(process.env.ACCESS_TOKEN_SECRET));

// Health check route
app.get('/health', (req, res) => {
  res.send(`Document service is running ${req.user?.data?.fullname || ''}`);
});


// Start server
const PORT = process.env.PORT || 2102;
app.listen(PORT, () => console.log(`Document Service running on ${PORT}/`));
