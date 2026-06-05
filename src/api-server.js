const http = require('http');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
const config = require('./config');
const logger = require('./utils/logger').child('api');
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

  app.use((err, req, res, _next) => {
    logger.exception(`${req.method} ${req.path}`, err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return { app, server, io };
}

function validateOAuthConfig() {
  const { clientId, clientSecret } = config.discord;
  if (!clientId) logger.warn('DISCORD_CLIENT_ID is missing — dashboard login will fail');
  if (!clientSecret) logger.warn('DISCORD_CLIENT_SECRET is missing — dashboard login will fail');
  else if (clientSecret === config.discord.token) {
    logger.warn('DISCORD_CLIENT_SECRET looks like the bot token — use OAuth2 Client Secret instead');
  }
  logger.info(`OAuth redirect URI: ${config.oauth.redirectUri}`);
}

function startApi() {
  validateOAuthConfig();
  const { server } = createApiServer();
  server.listen(config.api.port, () => {
    logger.info(`Listening on http://localhost:${config.api.port}`);
  });
  server.on('error', (err) => logger.exception('server', err));
  return server;
}

module.exports = { createApiServer, startApi };

if (require.main === module) {
  startApi();
}
