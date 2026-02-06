const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const apiRoutes = require('./routes/apiGateway.route');
const verifyJWT = require('@draftnsign/auth-lib');


const app = express();

app.use(cors({
  origin: "*"
}));


app.use(express.json());
app.use('/api', verifyJWT());
app.use('/api', apiRoutes);

const PORT = process.env.PORT || 2113;
app.listen(PORT, () => console.log(`Api Gateway running on ${PORT}/`));
