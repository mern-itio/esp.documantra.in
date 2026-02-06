const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const { connectDB } = require('./config/db');
const verifyJWT = require('@draftnsign/auth-lib');
const userSmtp = require('./routes/userSmtp');
const mailRoute = require('./routes/mail.route');

const app = express();

app.use(cors({
  origin: "*"
}));

connectDB();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/api', verifyJWT());
app.use('/api/smtp',userSmtp);
app.use('/mail', mailRoute);
const PORT = process.env.PORT || 2112;
app.listen(PORT, () => console.log(`Email running on ${PORT}/`));
