const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const verifyJWT = require('@draftnsign/auth-lib');
const cors = require('cors');
const connectDB = require('./config/db');

// Import routes
const aiAssistantRoutes = require('./routes/aiAssistantRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: "*"
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// DB Connection
connectDB();

// Health check route (no auth required)
app.get('/health', (req, res) => {
  res.json({
    service: 'AI Assistant Service',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// API Routes (require authentication)
app.use('/api', verifyJWT('user'));
app.use('/api/ai-assistant', aiAssistantRoutes);

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
const PORT = process.env.PORT || 2108;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AI Assistant Service running on port ${PORT}`);
});

