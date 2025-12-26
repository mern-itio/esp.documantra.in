const express = require('express');
const verifyJWT  = require('@draftnsign/auth-lib');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const eSignRoutes = require('./routes/eSignRoutes');
const publicRoutes = require('./routes/publicRoutes');
const certificateRoutes  = require('./routes/certificateRoutes');
const otpRoutes = require("./routes/otpRoutes");
const digitalSignatureRoutes = require('./routes/digitalSignatureRoutes');
const tsaRoutes = require('./routes/tsaRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const anchorRoutes = require('./routes/anchorRoutes');
const adminRoutes = require('./routes/adminRoutes');
const envelopeTypeRoutes = require('./routes/envelopeTypeRoutes');

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
// Health check route
app.get('/health', (req, res) => {
  res.send(`E-Sign service is running ${req.user?.data?.fullname || ''}`);
});
// API Routes
app.use('/api/e-sign/public', publicRoutes);
app.use("/api/e-sign", certificateRoutes);
app.use("/api/e-sign", otpRoutes);
app.use('/api/e-sign', digitalSignatureRoutes);
app.use('/api/e-sign', tsaRoutes);
app.use('/api/e-sign',verificationRoutes);
app.use('/api/e-sign/anchor', anchorRoutes);
app.use('/api/e-sign/envelope-types', verifyJWT(), envelopeTypeRoutes);
app.use('/api/e-sign', verifyJWT(), eSignRoutes);
app.use('/admin', verifyJWT("admin"),adminRoutes );
// Start server
const PORT = process.env.PORT || 2103;
app.listen(PORT, () => {
  console.log(`E-Sign Service running on ${PORT}/`);
  
  // Start scheduled envelope worker - works automatically in both dev and production
  // Inline the worker logic directly to avoid nodemon file watching issues
  let workerInterval = null;
  let isWorkerRunning = false;
  
  const runScheduledWorker = async () => {
    // Prevent concurrent runs
    if (isWorkerRunning) {
      return;
    }
    
    try {
      const mongoose = require('mongoose');
      
      // Only run if DB is connected
      if (mongoose.connection.readyState !== 1) {
        return;
      }
      
      isWorkerRunning = true;
      
      // Use the existing processScheduledEnvelopes function
      // Cache the require to avoid repeated file system access
      if (!global._scheduledWorkerController) {
        global._scheduledWorkerController = require('./controllers/mainController');
      }
      
      // Call the function directly
      if (global._scheduledWorkerController.processScheduledEnvelopes) {
        await global._scheduledWorkerController.processScheduledEnvelopes();
      }
    } catch (error) {
      // Silently handle errors - don't crash the server or trigger restarts
      // Only log non-connection errors
      if (error && error.message && 
          !error.message.includes('connection') && 
          !error.message.includes('Cannot find module') &&
          !error.message.includes('processScheduledEnvelopes')) {
        // Suppress error to avoid triggering nodemon
      }
    } finally {
      isWorkerRunning = false;
    }
  };
  
  // Initialize worker after server starts and DB connects
  const initializeWorker = () => {
    try {
      const mongoose = require('mongoose');
      
      if (mongoose.connection.readyState === 1) {
        // Clear any existing interval
        if (workerInterval) {
          clearInterval(workerInterval);
        }
        
        // Run worker immediately
        runScheduledWorker().catch(() => {});
        
        // Set up interval to run worker every minute
        workerInterval = setInterval(() => {
          runScheduledWorker().catch(() => {});
        }, 60000); // Run every minute
        
        console.log('✅ Scheduled envelope worker started - will process scheduled envelopes every minute');
      } else {
        // Wait for DB connection and retry
        setTimeout(initializeWorker, 2000);
      }
    } catch (error) {
      // Silently handle initialization errors
      setTimeout(initializeWorker, 5000);
    }
  };
  
  // Start worker after a short delay to ensure everything is ready
  // This delay helps avoid nodemon restart issues
  setTimeout(initializeWorker, 5000);
});
