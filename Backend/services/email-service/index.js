const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const { connectDB } = require('./config/db');
const verifyJWT = require('@draftnsign/auth-lib');
const { getCorsOptions, applySecurityHeaders, createErrorHandler } = require('@draftnsign/validators');
const userSmtp = require('./routes/userSmtp');
const mailRoute = require('./routes/mail.route');
const templateRoute = require('./routes/templateRoute');

const app = express();

applySecurityHeaders(app);
app.use(cors(getCorsOptions()));

connectDB();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/api', verifyJWT());
app.use('/api/smtp',userSmtp);
app.use('/mail', mailRoute);
app.use('/admin',verifyJWT('admin'));
app.use('/user',verifyJWT('user'));
app.use('/user/template',templateRoute);
app.use('/admin/template',templateRoute)

app.use(createErrorHandler('Email'));

const PORT = process.env.PORT || 2112;
app.listen(PORT, () => console.log(`Email running on ${PORT}/`));
