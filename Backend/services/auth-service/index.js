const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const cors = require('cors');
const { connectDB } = require('./config/db');
const authRoutes = require('./routes/authRoutes');

dotenv.config();

const app = express();

app.use(cors({
  origin: "*"
}));

connectDB();

app.use(express.json());
app.use('/', authRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Auth running on http://localhost:${PORT}/`));
