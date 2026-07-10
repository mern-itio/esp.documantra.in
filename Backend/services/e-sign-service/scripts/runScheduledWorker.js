// Script to manually run the scheduled envelope worker
// Usage: node scripts/runScheduledWorker.js
// Or: npm run worker (if added to package.json)

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const { processScheduledEnvelopes, processAutoReminders } = require('../controllers/mainController');

async function runWorker() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    
    console.log('Processing scheduled envelopes...');
    const result = await processScheduledEnvelopes();
    
    if (result && result.processed > 0) {
      console.log(`✅ Successfully processed ${result.processed} scheduled envelope(s)`);
    } else {
      console.log('ℹ️  No scheduled envelopes to process');
    }

    console.log('Processing auto reminders...');
    const reminderResult = await processAutoReminders();
    if (reminderResult && reminderResult.processed > 0) {
      console.log(`✅ Sent auto reminders for ${reminderResult.processed} envelope(s)`);
    } else {
      console.log('ℹ️  No auto reminders due');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running worker:', error);
    process.exit(1);
  }
}

runWorker();

