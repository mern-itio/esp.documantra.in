const mongoose = require('mongoose');
const Document = require('../models/Document');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);

// Load environment variables
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Clean up expired documents
const cleanupExpiredDocuments = async () => {
  try {
    console.log('🔍 Starting cleanup of expired documents...');
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Find documents that have been in trash for more than 30 days
    const expiredDocuments = await Document.find({
      isDeleted: true,
      deletedAt: { $lt: thirtyDaysAgo }
    });

    console.log(`📊 Found ${expiredDocuments.length} expired documents to clean up`);

    let deletedCount = 0;
    let errorCount = 0;

    for (const document of expiredDocuments) {
      try {
        // Delete the physical file
        if (document.filePath && fs.existsSync(document.filePath)) {
          await unlinkAsync(document.filePath);
          console.log(`🗑️  Deleted physical file: ${document.filePath}`);
        }

        // Delete the document record
        await Document.findByIdAndDelete(document._id);
        deletedCount++;

        console.log(`✅ Permanently deleted expired document: ${document.name} (ID: ${document._id})`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to delete expired document ${document._id}:`, error);
      }
    }

    console.log(`\n🎯 Cleanup completed:`);
    console.log(`   ✅ Successfully deleted: ${deletedCount} documents`);
    console.log(`   ❌ Errors: ${errorCount} documents`);
    console.log(`   📅 Cutoff date: ${thirtyDaysAgo.toISOString()}`);

    return { deletedCount, errorCount };

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await cleanupExpiredDocuments();
    console.log('✅ Cleanup script completed successfully');
  } catch (error) {
    console.error('❌ Cleanup script failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB disconnected');
    process.exit(0);
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { cleanupExpiredDocuments };
