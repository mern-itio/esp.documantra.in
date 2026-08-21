const mongoose = require('mongoose');

const connectDB = async () => {
  const maxAttempts = 10;
  const delayMs = 3000;
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('Support Service MongoDB connection failed: MONGO_URI is not set');
    process.exit(1);
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await mongoose.connect(mongoUri);
      console.log('Support Service MongoDB connected');
      return;
    } catch (err) {
      console.error(
        `Support Service MongoDB connection attempt ${attempt}/${maxAttempts} failed:`,
        err.message,
      );
      if (attempt === maxAttempts) {
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
};

module.exports = { connectDB };

