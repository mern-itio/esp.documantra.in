require('dotenv').config();
const connectDB = require('../config/db');
// DB Connection
connectDB();
const { runAnchoringBatch } = require('../services/anchoringService');

async function testAnchoring() {
  try {
    const result = await runAnchoringBatch(5); // test with max 5 pending signatures
    console.log('Anchoring result:', result);
  } catch (err) {
    console.error('Anchoring failed:', err);
  }
}

testAnchoring();
