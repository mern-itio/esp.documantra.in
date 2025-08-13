const express = require('express');
const verifyJWT  = require('@draftnsign/auth-lib');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Import routes
const documentRoutes = require('./routes/documentRoutes');
const folderRoutes = require('./routes/folderRoutes');
const commentRoutes = require('./routes/commentRoutes');
const versionRoutes = require('./routes/versionRoutes');
const workflowRoutes = require('./routes/workflowRoutes');

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

// Health check route (no auth required)
app.get('/health', (req, res) => {
  res.send(`Document Service is running`);
});

// Email service health check
// app.get('/health/email', (req, res) => {
//   const emailService = require('./services/emailService');
  
//   // Try to initialize if not already configured
//   if (!emailService.isConfigured()) {
//     emailService.initializeTransporter();
//   }
  
//   const configStatus = {
//     configured: emailService.isConfigured(),
//     hasUser: !!process.env.EMAIL_USER,
//     hasPassword: !!process.env.EMAIL_PASSWORD,
//     hasService: !!process.env.EMAIL_SERVICE,
//     service: process.env.EMAIL_SERVICE || 'gmail',
//     user: process.env.EMAIL_USER || 'NOT SET',
//     from: process.env.EMAIL_FROM || 'NOT SET'
//   };
  
//   res.json({
//     service: 'Document Service',
//     status: 'running',
//     email: configStatus,
//     timestamp: new Date().toISOString()
//   });
// });

// Test email endpoint
// app.get('/test-email', async (req, res) => {
//   const emailService = require('./services/emailService');
  
//   // Try to initialize if not already configured
//   if (!emailService.isConfigured()) {
//     emailService.initializeTransporter();
//   }
  
//   if (!emailService.isConfigured()) {
//     return res.status(400).json({
//       success: false,
//       message: 'Email service not configured',
//       config: {
//         hasUser: !!process.env.EMAIL_USER,
//         hasPassword: !!process.env.EMAIL_PASSWORD,
//         hasService: !!process.env.EMAIL_SERVICE
//       }
//     });
//   }
  
//   try {
//     // Send a test email to the configured user
//     const testResult = await emailService.sendTestEmail();
//     res.json({
//       success: true,
//       message: 'Test email sent successfully',
//       result: testResult
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Failed to send test email',
//       error: error.message
//     });
//   }
// });

// JWT Middleware (applied to API routes only)
app.use('/api', verifyJWT(process.env.ACCESS_TOKEN_SECRET));

// API Routes
app.use('/api/documents', documentRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api', commentRoutes);
app.use('/api', versionRoutes);
app.use('/api', workflowRoutes);

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
app.listen(PORT, () => {
  console.log(`Document Service running on ${PORT}/`);
  
  // Initialize email service after environment is loaded
  // const emailService = require('./services/emailService');
  // emailService.initializeTransporter();
  
  // if (emailService.isConfigured()) {
  //   console.log('✅ Email service is configured and ready');
  // } else {
  //   console.log('⚠️ Email service is not configured. Workflows will work without email notifications.');
  //   console.log('   To enable email notifications, set EMAIL_USER, EMAIL_PASSWORD, and EMAIL_FROM in your .env file');
  // }
});
