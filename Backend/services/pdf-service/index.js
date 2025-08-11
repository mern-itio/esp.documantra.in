const express = require('express');
const verifyJWT  = require('@draftnsign/auth-lib');
const cors = require('cors');
const dotenv = require('dotenv');
const pdfRoutes = require('./routes/pdfRoutes');
const connectDB = require('./config/db');
const path = require('path');
const fs = require('fs-extra');
const helmet = require('helmet');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: "*"
}));
app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// DB Connection
connectDB();

// JWT Middleware
app.use(verifyJWT(process.env.ACCESS_TOKEN_SECRET));

// Health check route
app.get('/health', (req, res) => {
  res.send(`PDF service is running ${req.user?.data?.fullname || ''}`);
});

// Conversion routes
app.use('/pdf', pdfRoutes);

// Start server
const PORT = process.env.PORT || 4001;
app.listen(PORT, () => console.log(`PDF Service running on http://localhost:${PORT}/`));
