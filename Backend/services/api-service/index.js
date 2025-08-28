const express = require('express');
const dotenv = require('dotenv');
const verifyJWT  = require('@draftnsign/auth-lib');
dotenv.config();
const cors = require('cors');
const { connectDB } = require('./config/db');
const apiRoutes = require('./routes/apiRoutes');
const esignRoutes = require('./routes/e-signRoute');
const analyticsMiddleware = require('./middleware/analytics');

const app = express();

app.use(cors({
  origin: "*"
}));

// JSON parsing middleware
app.use(express.json());

connectDB();
// JWT Middleware
// app.use(verifyJWT(process.env.ACCESS_TOKEN_SECRET));

app.use(express.json());
 app.get('/api/api-service/health', (_, res) => res.send('API Service is running'));

app.use('/api/api-service', verifyJWT(process.env.ACCESS_TOKEN_SECRET), apiRoutes);
app.use('/api/api-service/sign', verifyJWT(process.env.ACCESS_TOKEN_SECRET), analyticsMiddleware, esignRoutes );

const PORT = process.env.PORT || 2105;
app.listen(PORT, () => console.log(`API Service running on ${PORT}/`));
