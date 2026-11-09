require('dotenv').config();

const http = require('http');
const express = require('express');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');
const chatHandler = require('./sockets/chatHandler');
const { notFound, errorHandler } = require('./middleware/errorHandler');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not defined. Set it in your .env file.');
  process.exit(1);
}

const app = express();

// ---- Global middleware ----
app.use(express.json({ limit: '100kb' }));

// ---- Routes ----
app.get('/', (req, res) => {
  res.json({ message: 'Secure Connect API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);

// ---- Error handling (must be last) ----
app.use(notFound);
app.use(errorHandler);

// ---- HTTP + Socket.IO on the same server ----
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

chatHandler(io);

// ---- Process-level safety nets ----
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  httpServer.listen(PORT, () => {
    console.log(`[server] listening on http://localhost:${PORT}`);
  });
};

startServer();
