const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const { connectDB } = require('./config/db');;
const verifyJWT = require('@draftnsign/auth-lib');
const identityRoute = require('./routes/identityRoute');
const diditWebhook = require('./webhooks/diditWebhook');
const app = express();

app.use(cors({
  origin: "*"
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static('uploads'));

connectDB();
app.get('/health', (req, res) => {
  res.send(`Identity service is running ${req.user?.data?.fullname || ''}`);
});
app.use(express.json());
// app.use('/api', verifyJWT());
app.use('/api/identity', identityRoute);
app.use('/webhook/didit', diditWebhook);

const PORT = process.env.PORT || 2114;
app.listen(PORT, () => console.log(`Identity service running on ${PORT}/`));
