const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const apiRoutes = require('./routes/apiGateway.route');
const verifyJWT = require('@draftnsign/auth-lib');
const { getCorsOptions, applySecurityHeaders, createErrorHandler } = require('@draftnsign/validators');


const app = express();

applySecurityHeaders(app);

app.use(cors(getCorsOptions()));


app.use(express.json());
app.use('/api', verifyJWT());
app.use('/api', apiRoutes);

app.use(createErrorHandler('API-Gateway'));

const PORT = process.env.PORT || 2113;
app.listen(PORT, () => console.log(`Api Gateway running on ${PORT}/`));
