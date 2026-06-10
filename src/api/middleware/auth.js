const jwt = require('jsonwebtoken');
const config = require('../../config');
const botRegistry = require('../../discord/botRegistry');
const DashboardAccessService = require('../../services/DashboardAccessService');

function requireAuth(req, res, next) {
  const token = req.cookies?.minnie_token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, config.api.jwtSecret);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireGuildDashboardAccess(req, res, next) {
  const guildId = req.params.guildId || req.body.guildId || req.query.guildId;
  if (!guildId) return res.status(400).json({ error: 'guildId required' });

  const guildEntry = req.user.guilds?.find((g) => g.id === guildId);
  if (!guildEntry && !DashboardAccessService.isDevUser(req.user.id)) {
    return res.status(403).json({ error: 'No dashboard access for this server' });
  }

  if (!botRegistry.isBotInGuild(guildId)) {
    return res.status(403).json({ error: 'Minnie bot is not in this server' });
  }

  req.guildId = guildId;
  req.guildAccess = guildEntry?.access || (DashboardAccessService.isDevUser(req.user.id) ? 'dev' : null);
  next();
}

module.exports = { requireAuth, requireGuildDashboardAccess, requireGuildAdmin: requireGuildDashboardAccess };
