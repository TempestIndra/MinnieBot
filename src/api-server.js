const http = require('http');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
const config = require('./config');
const { initializeDatabase } = require('./database/init');
const { createRouter } = require('./api/routes');
const realtimeEmitter = require('./realtime/emitter');
const XpService = require('./services/XpService');

function createApiServer() {
  initializeDatabase();

  const app = express();
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: { origin: process.env.DASHBOARD_URL || 'http://localhost:3000', credentials: true },
  });

  realtimeEmitter.attach(io);
  XpService.setRealtimeEmitter(realtimeEmitter);

  io.on('connection', (socket) => {
    socket.on('join:guild', (guildId) => {
      if (guildId) realtimeEmitter.joinGuild(socket, guildId);
    });
  });

  app.use(cors({
    origin: process.env.DASHBOARD_URL || 'http://localhost:3000',
    credentials: true,
  }));
  app.use(express.json());
  app.use(cookieParser());

  app.get('/health', (_, res) => res.json({ status: 'ok' }));
  app.use('/api', createRouter());

  app.use((err, _req, res, _next) => {
    console.error('[API]', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return { app, server, io };
}

function startApi() {
  const { server } = createApiServer();
  server.listen(config.api.port, () => {
    console.log(`[API] Listening on http://localhost:${config.api.port}`);
  });
  return server;
}

module.exports = { createApiServer, startApi };

if (require.main === module) {
  startApi();
}
