const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const { connectDB } = require('./config/db');
const verifyJWT = require('@draftnsign/auth-lib');


const app = express();

app.use(cors({
  origin: "*"
}));

connectDB();

app.use(express.json());
app.use('/api', verifyJWT());

const PORT = process.env.PORT || 2110;
app.listen(PORT, () => console.log(`Email running on ${PORT}/`));
