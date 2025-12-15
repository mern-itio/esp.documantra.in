const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const { connectDB } = require('./config/db');
const verifyJWT = require('@draftnsign/auth-lib');
const organizationRoutes = require('./routes/organization.routes');

const app = express();

app.use(cors({
  origin: "*"
}));

connectDB();

app.use(express.json());
app.use('/api', verifyJWT());
app.use('/api/organization', organizationRoutes);

const PORT = process.env.PORT || 2111;
app.listen(PORT, () => console.log(`Organization running on ${PORT}/`));
