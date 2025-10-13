const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const { connectDB } = require('./config/db');
const adminRoutes = require('./routes/adminRoutes');
const publicRoutes = require('./routes/publicRoutes');
const verifyJWT = require('@draftnsign/auth-lib');

const app = express();

app.use(cors({
  origin: "*"
}));

connectDB();

app.use(express.json());

// Public routes (no auth required)
app.use('/admin/public', publicRoutes);

// Protected admin routes (auth required)
app.use('/admin', verifyJWT('admin'));
app.use('/admin', adminRoutes);

const PORT = process.env.PORT || 3100;
app.listen(PORT, () => console.log(`Admin running on ${PORT}/`));
