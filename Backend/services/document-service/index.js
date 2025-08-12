const express = require('express');
const verifyJWT  = require('@draftnsign/auth-lib');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Import routes
const documentRoutes = require('./routes/documentRoutes');
const folderRoutes = require('./routes/folderRoutes');

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

// API Routes
app.use('/api/documents', documentRoutes);
app.use('/api/folders', folderRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      error: error.message
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      error: 'Invalid document or folder ID'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 2102;
app.listen(PORT, () => console.log(`Document Service running on ${PORT}/`));
