const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);

    // Don’t crash the app
    // Retry after some delay
    setTimeout(connectDB, 5000); // retry every 5s
  }
};

module.exports = connectDB;
