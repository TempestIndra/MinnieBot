const jwt = require('jsonwebtoken');
const config = require('../../config');

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

function requireGuildAdmin(req, res, next) {
  const guildId = req.params.guildId || req.body.guildId || req.query.guildId;
  if (!guildId) return res.status(400).json({ error: 'guildId required' });

  const guild = req.user.guilds?.find((g) => g.id === guildId);
  if (!guild) return res.status(403).json({ error: 'Not a member of this guild' });

  const perm = BigInt(guild.permissions);
  const ADMIN = BigInt(0x8);
  if ((perm & ADMIN) !== ADMIN) {
    return res.status(403).json({ error: 'Administrator permission required' });
  }

  req.guildId = guildId;
  next();
}

module.exports = { requireAuth, requireGuildAdmin };
