const express = require('express');
const verifyJWT  = require('@draftnsign/auth-lib');
const cors = require('cors');
const dotenv = require('dotenv');
const pdfRoutes = require('./routes/pdfRoutes');
const conversionRoutes = require('./routes/pdftoImage');
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

// Ensure epubs directory exists
const epubsDir = path.join(__dirname, 'epubs');
fs.ensureDirSync(epubsDir);
console.log(`PDF Service: EPUBs directory ensured at: ${epubsDir}`);

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

// Add debugging middleware for /outputs requests
app.use('/outputs', (req, res, next) => {
  console.log(`PDF Service: Static file request for: ${req.url}`);
  console.log(`PDF Service: Full path: ${path.join(__dirname, 'outputs', req.url)}`);
  next();
});

// Serve converted files (outputs directory) - no auth required
app.use('/outputs', express.static(path.join(__dirname, 'outputs')));
app.use("/uploads", express.static("uploads"));
app.use("/images", express.static("images"));
app.use("/epubs", express.static("epubs")); // Serve EPUB files

// Serve PDF files from root directory - no auth required
app.get('/converted_*.pdf', (req, res, next) => {
  console.log(`PDF Service: Converted PDF file request for: ${req.url}`);
  const pdfPath = path.join(__dirname, req.url);
  console.log(`PDF Service: Full PDF path: ${pdfPath}`);
  
  if (fs.existsSync(pdfPath)) {
    console.log(`PDF Service: PDF file found, serving: ${pdfPath}`);
    res.sendFile(pdfPath);
  } else {
    console.log(`PDF Service: PDF file not found: ${pdfPath}`);
    res.status(404).send('PDF file not found');
  }
});

// Serve any other PDF files from root directory - no auth required
app.get('/*.pdf', (req, res, next) => {
  console.log(`PDF Service: General PDF file request for: ${req.url}`);
  const pdfPath = path.join(__dirname, req.url);
  console.log(`PDF Service: Full PDF path: ${pdfPath}`);
  
  if (fs.existsSync(pdfPath)) {
    console.log(`PDF Service: PDF file found, serving: ${pdfPath}`);
    res.sendFile(pdfPath);
  } else {
    console.log(`PDF Service: PDF file not found: ${pdfPath}`);
    next(); // Continue to next middleware if file not found
  }
});
app.use('/pdf', pdfRoutes);
app.use('/convert', conversionRoutes);
// JWT Middleware (for conversion routes only)
app.use(verifyJWT(process.env.ACCESS_TOKEN_SECRET));

// Conversion routes


// Start server
const PORT = process.env.PORT || 2104;
app.listen(PORT, () => console.log(`PDF Service running on ${PORT}/`));
