const express = require('express');
const verifyJWT  = require('@draftnsign/auth-lib');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const eSignRoutes = require('./routes/eSignRoutes');
const publicRoutes = require('./routes/publicRoutes');
const certificateRoutes  = require('./routes/certificateRoutes');
const otpRoutes = require("./routes/otpRoutes");
const digitalSignatureRoutes = require('./routes/digitalSignatureRoutes');
const tsaRoutes = require('./routes/tsaRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const anchorRoutes = require('./routes/anchorRoutes');

dotenv.config();
const app = express(); 
// Middleware
app.use(cors({
  origin: "*"
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static('uploads'));

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
app.use('/api/e-sign/',verificationRoutes);
app.use('/api/e-sign/anchor', anchorRoutes);

app.use('/api/e-sign', verifyJWT(process.env.ACCESS_TOKEN_SECRET), eSignRoutes);
// Start server
const PORT = process.env.PORT || 2103;
app.listen(PORT, () => console.log(`E-Sign Service running on ${PORT}/`));
