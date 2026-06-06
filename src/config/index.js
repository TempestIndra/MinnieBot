const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

/** Trim whitespace and optional quotes from .env values */
function env(key) {
  const raw = process.env[key];
  if (!raw) return undefined;
  let v = raw.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1).trim();
  }
  return v;
}

module.exports = {
  discord: {
    token: env('DISCORD_TOKEN'),
    clientId: env('DISCORD_CLIENT_ID'),
    clientSecret: env('DISCORD_CLIENT_SECRET'),
  },
  oauth: {
    redirectUri: env('OAUTH_REDIRECT_URI') || 'http://localhost:3000/auth/discord/callback',
    scopes: (env('OAUTH_SCOPES') || 'identify guilds').split(' '),
  },
  api: {
    port: parseInt(process.env.API_PORT || '4000', 10),
    url: process.env.API_URL || 'http://localhost:4000',
    sessionSecret: process.env.SESSION_SECRET || 'dev-session-secret-change-me',
    jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-change-me',
  },
  database: {
    path: process.env.DATABASE_PATH || './data/minnie.db',
  },
  defaults: {
    voiceXpRate: parseFloat(process.env.DEFAULT_VOICE_XP_RATE || '5'),
    textXpMin: parseInt(process.env.DEFAULT_TEXT_XP_MIN || '5', 10),
    textXpMax: parseInt(process.env.DEFAULT_TEXT_XP_MAX || '10', 10),
    textCooldown: parseInt(process.env.DEFAULT_TEXT_COOLDOWN || '60', 10),
    dailyXpCap: parseInt(process.env.DEFAULT_DAILY_XP_CAP || '500', 10),
    minMessageLength: parseInt(process.env.DEFAULT_MIN_MESSAGE_LENGTH || '3', 10),
    maxLevel: parseInt(process.env.DEFAULT_MAX_LEVEL || '100', 10),
    prestigeMax: parseInt(process.env.DEFAULT_PRESTIGE_MAX || '10', 10),
  },
  voice: {
    tickIntervalMs: 60_000,
  },
  resets: {
    weeklyCron: '0 0 * * 1',
    seasonCron: '0 0 1 * *',
    dailyCron: '0 0 * * *',
  },
  isDev: process.env.NODE_ENV !== 'production',
  dashboard: {
    url: env('DASHBOARD_URL') || 'http://localhost:3000',
    linkText: env('DASHBOARD_LINK_TEXT') || 'Open Admin Dashboard',
    embedTitle: env('DASHBOARD_EMBED_TITLE') || 'Minnie XP Dashboard',
    embedDescription:
      env('DASHBOARD_EMBED_DESCRIPTION')
      || 'Manage XP rates, level roles, shop, quests, and more. **Server administrators only.**',
  },
};
