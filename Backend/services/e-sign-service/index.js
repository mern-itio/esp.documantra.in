const express = require('express');
const verifyJWT  = require('@draftnsign/auth-lib');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { getCorsOptions, applySecurityHeaders, createErrorHandler, createMulterErrorHandler } = require('@draftnsign/validators');
const eSignRoutes = require('./routes/eSignRoutes');
const publicRoutes = require('./routes/publicRoutes');
const certificateRoutes  = require('./routes/certificateRoutes');
const otpRoutes = require("./routes/otpRoutes");
const digitalSignatureRoutes = require('./routes/digitalSignatureRoutes');
const { serveUploadFile } = require('./controllers/uploadServeController');
const optionalJwt = require('./middleware/optionalJwt');
const tsaRoutes = require('./routes/tsaRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const anchorRoutes = require('./routes/anchorRoutes');
const adminRoutes = require('./routes/adminRoutes');
const envelopeTypeRoutes = require('./routes/envelopeTypeRoutes');

dotenv.config();
const app = express(); 
applySecurityHeaders(app);
app.use(cors(getCorsOptions()));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.get('/uploads/:filename', optionalJwt(), serveUploadFile);

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

app.use(createMulterErrorHandler());
app.use(createErrorHandler('E-Sign'));

// Start server
const PORT = process.env.PORT || 2103;
app.listen(PORT, () => {
  console.log(`E-Sign Service running on ${PORT}/`);
  let workerInterval = null;
  let isWorkerRunning = false;
  
  const runScheduledWorker = async () => {
    if (isWorkerRunning) {
      // console.log('[Scheduled Worker] Skipping - previous run still in progress');
      return;
    }
    
    try {
      const mongoose = require('mongoose');
      
      if (mongoose.connection.readyState !== 1) {
        // console.log('[Scheduled Worker] Skipping - database not connected (state:', mongoose.connection.readyState, ')');
        return;
      }
      
      isWorkerRunning = true;
      if (!global._scheduledWorkerController) {
        try {
          global._scheduledWorkerController = require('./controllers/mainController');
          // console.log('[Scheduled Worker] Controller loaded successfully');
        } catch (requireError) {
          console.error('[Scheduled Worker] Failed to load controller:', requireError.message);
          throw requireError;
        }
      }
      if (global._scheduledWorkerController.processScheduledEnvelopes) {
        const result = await global._scheduledWorkerController.processScheduledEnvelopes();
        if (result && result.processed > 0) {
          // console.log(`[Scheduled Worker] ✅ Processed ${result.processed} scheduled envelope(s)`);
        }
      } else {
        console.error('[Scheduled Worker] processScheduledEnvelopes function not found in controller');
      }
    } catch (error) {
      const isConnectionError = error && error.message && (
        error.message.includes('connection') || 
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('MongoNetworkError')
      );
      
      if (!isConnectionError) {
        console.error('[Scheduled Worker] ❌ Error processing scheduled envelopes:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      } else {
        console.log('[Scheduled Worker] ⚠️ Database connection issue (will retry):', error.message);
      }
    } finally {
      isWorkerRunning = false;
    }
  };
  
  const initializeWorker = () => {
    try {
      const mongoose = require('mongoose');
      
      if (mongoose.connection.readyState === 1) {
        if (workerInterval) {
          clearInterval(workerInterval);
        }
        runScheduledWorker().catch((err) => {
          console.error('[Scheduled Worker] Initial run error:', err.message);
        });
        
        workerInterval = setInterval(() => {
          runScheduledWorker().catch((err) => {
            console.error('[Scheduled Worker] Interval run error:', err.message);
          });
        }, 60000); 
        
        // console.log('✅ Scheduled envelope worker started - will process scheduled envelopes every minute');
        // console.log('[Scheduled Worker] Worker initialized at:', new Date().toISOString());
      } else {
       
        console.log('[Scheduled Worker] Waiting for database connection... (state:', mongoose.connection.readyState, ')');
        setTimeout(initializeWorker, 2000);
      }
    } catch (error) {
     
      console.error('[Scheduled Worker] Initialization error:', error.message);
      setTimeout(initializeWorker, 5000);
    }
  };
  setTimeout(initializeWorker, 5000);
});
