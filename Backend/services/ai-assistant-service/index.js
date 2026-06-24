const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const verifyJWT = require('@draftnsign/auth-lib');
const cors = require('cors');
const connectDB = require('./config/db');
const { getCorsOptions, applySecurityHeaders, createErrorHandler } = require('@draftnsign/validators');

// Import routes
const aiAssistantRoutes = require('./routes/aiAssistantRoutes');

const app = express();

applySecurityHeaders(app);
app.use(cors(getCorsOptions()));
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

app.use(createErrorHandler('AI-Assistant'));

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

