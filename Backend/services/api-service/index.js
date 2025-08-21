const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const { connectDB } = require('./config/db');
const apiRoutes = require('./routes/apiRoutes');
const verifyJWT  = require('@draftnsign/auth-lib');


const app = express();

app.use(cors({
  origin: "*"
}));

connectDB();
// JWT Middleware
app.use(verifyJWT(process.env.ACCESS_TOKEN_SECRET));

app.use(express.json());
app.use('/api/api-service', apiRoutes);

const PORT = process.env.PORT || 2105;
app.listen(PORT, () => console.log(`API Service running on ${PORT}/`));
