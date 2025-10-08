const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const { connectDB } = require('./config/db');
const adminRoutes = require('./routes/adminRoutes');
const verifyJWT = require('@draftnsign/auth-lib');

const app = express();

app.use(cors({
  origin: "*"
}));

connectDB();

app.use(express.json());
app.use('/admin', verifyJWT('admin'));
app.use('/admin', adminRoutes);

const PORT = process.env.PORT || 3100;
app.listen(PORT, () => console.log(`Auth running on ${PORT}/`));
