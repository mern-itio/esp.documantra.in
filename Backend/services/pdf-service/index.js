const express = require('express');
const verifyJWT  = require('@draftnsign/auth-lib');
const cors = require('cors');
const dotenv = require('dotenv');
const pdfRoutes = require('./routes/pdfRoutes');
const connectDB = require('./config/db');
const path = require('path');
const fs = require('fs-extra');
const helmet = require('helmet');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: "*"
}));
app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// DB Connection
connectDB();

// Ensure outputs directory exists
const outputsDir = path.join(__dirname, 'outputs');
fs.ensureDirSync(outputsDir);
console.log(`PDF Service: Outputs directory ensured at: ${outputsDir}`);

// Cleanup old files every hour (files older than 24 hours)
setInterval(async () => {
  try {
    const files = await fs.readdir(outputsDir);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    for (const file of files) {
      const filePath = path.join(outputsDir, file);
      const stats = await fs.stat(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        await fs.remove(filePath);
        console.log(`Cleaned up old file: ${file}`);
      }
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}, 60 * 60 * 1000); // Run every hour

// Health check route (no auth required)
app.get('/health', (req, res) => {
  res.send(`PDF service is running ${req.user?.data?.fullname || ''}`);
});

// Debug endpoint to list files in outputs directory (no auth required)
app.get('/debug/outputs', async (req, res) => {
  try {
    const files = await fs.readdir(outputsDir);
    const fileStats = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(outputsDir, file);
        const stats = await fs.stat(filePath);
        return {
          name: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      })
    );
    
    res.json({
      outputsDir,
      fileCount: files.length,
      files: fileStats
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to list outputs directory',
      message: error.message,
      outputsDir
    });
  }
});

// Add debugging middleware for /outputs requests
app.use('/outputs', (req, res, next) => {
  console.log(`PDF Service: Static file request for: ${req.url}`);
  console.log(`PDF Service: Full path: ${path.join(__dirname, 'outputs', req.url)}`);
  next();
});

// Serve converted files (outputs directory) - no auth required
app.use('/outputs', express.static(path.join(__dirname, 'outputs')));

// JWT Middleware (for conversion routes only)
app.use(verifyJWT(process.env.ACCESS_TOKEN_SECRET));

// Conversion routes
app.use('/pdf', pdfRoutes);

// Start server
const PORT = process.env.PORT || 2104;
app.listen(PORT, () => console.log(`PDF Service running on ${PORT}/`));
