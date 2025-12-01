const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const { connectDB } = require('./config/db');
const customerRoutes = require('./routes/customerRoutes');
const agentRoutes = require('./routes/agentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const SocketService = require('./services/socketService');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.IO setup with CORS
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Initialize Socket.IO service
const socketService = new SocketService(io);

// Make io accessible to controllers
app.set('io', io);

// Middleware
app.use(helmet({
  contentSecurityPolicy: false // Allow Socket.IO connections
}));

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Connect to database
connectDB();

// Validate JWT secrets are configured
const agentSecret = process.env.AGENT_ACCESS_TOKEN_SECRET || 
                   process.env.ADMIN_ACCESS_TOKEN_SECRET || 
                   process.env.ACCESS_TOKEN_SECRET;
if (!agentSecret) {
  console.warn('⚠️  WARNING: No JWT secret configured!');
  console.warn('   Set AGENT_ACCESS_TOKEN_SECRET, ADMIN_ACCESS_TOKEN_SECRET, or ACCESS_TOKEN_SECRET in .env');
  console.warn('   Agent authentication will fail until a secret is configured.');
} else {
  console.log('✅ JWT secret configured for agent authentication');
}

// Health check
app.get('/api/support-service/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'support-service',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/support-service/customer', customerRoutes);
app.use('/api/support-service/agent', agentRoutes);
app.use('/api/support-service/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    status: err.status || 500,
    message: err.message || 'Internal server error',
    data: null
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 404,
    message: 'Route not found',
    data: null
  });
});

const PORT = process.env.PORT || 2107;

server.listen(PORT, () => {
  console.log(`Support Service running on port ${PORT}`);
  console.log(`Socket.IO server ready`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = { app, io };

