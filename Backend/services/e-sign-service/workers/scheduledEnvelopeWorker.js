// Worker to process scheduled envelopes
// This can be run as a separate process or integrated into the main service
const mongoose = require('mongoose');
const { processScheduledEnvelopes } = require('../controllers/mainController');
const connectDB = require('../config/db');

// Process scheduled envelopes
const runWorker = async () => {
  try {
    // Only run if mongoose is connected (avoid errors during server restart)
    if (mongoose.connection.readyState !== 1) {
      // Not connected, skip this run
      return { processed: 0 };
    }
    
    const result = await processScheduledEnvelopes();
    if (result && result.processed > 0) {
      console.log(`Scheduled envelope worker: ${result.processed} envelope(s) processed`);
    }
    return result || { processed: 0 };
  } catch (error) {
    // Don't log errors if it's just a connection issue during restart
    if (error.message && !error.message.includes('connection')) {
      console.error('Scheduled envelope worker error:', error);
    }
    return { processed: 0 };
  } finally {
    // Close connection if running as standalone script
    if (process.env.STANDALONE_WORKER === 'true') {
      await mongoose.connection.close();
      process.exit(0);
    }
  }
};

// If running as standalone script
if (require.main === module) {
  runWorker();
}

// Export for use in main service
module.exports = { runWorker };

