
const mongoose = require('mongoose');
const { processScheduledEnvelopes } = require('../controllers/mainController');
const connectDB = require('../config/db');


const runWorker = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return { processed: 0 };
    }
    
    const result = await processScheduledEnvelopes();
    if (result && result.processed > 0) {
      console.log(`Scheduled envelope worker: ${result.processed} envelope(s) processed`);
    }
    return result || { processed: 0 };
  } catch (error) {
    if (error.message && !error.message.includes('connection')) {
      console.error('Scheduled envelope worker error:', error);
    }
    return { processed: 0 };
  } finally {
    if (process.env.STANDALONE_WORKER === 'true') {
      await mongoose.connection.close();
      process.exit(0);
    }
  }
};
if (require.main === module) {
  runWorker();
}

module.exports = { runWorker };

