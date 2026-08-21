const fs = require('fs');
const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const verifyJWT  = require('@draftnsign/auth-lib');
const cors = require('cors');
const { connectDB } = require('./config/db');
const { getCorsOptions, applySecurityHeaders, createErrorHandler } = require('@draftnsign/validators');
const apiRoutes = require('./routes/apiRoutes');
const community = require('./routes/community');
const esignRoutes = require('./routes/e-signRoute');
const supportTickets = require('./routes/supportTicket');
const analyticsMiddleware = require('./middleware/analytics');

const app = express();

applySecurityHeaders(app);
app.use(cors(getCorsOptions()));

// JSON parsing middleware
app.use(express.json());

connectDB();
// JWT Middleware
// app.use(verifyJWT(process.env.ACCESS_TOKEN_SECRET));

app.use(express.json());
 app.get('/api/api-service/health', (_, res) => res.send('API Service is running'));

app.use('/api/api-service', verifyJWT('user'), apiRoutes);
app.use('/api/api-service/community', verifyJWT('user'), community);
app.use('/api/api-service/tickets', verifyJWT('user'), supportTickets);
app.use('/api/api-service/sign', verifyJWT('user'), analyticsMiddleware, esignRoutes );

app.use(createErrorHandler('API-Service'));

const PORT = process.env.PORT || 2105;
app.listen(PORT, () => console.log(`API Service running on ${PORT}/`));
