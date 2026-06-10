const GuildSettingsRepository = require('../repositories/GuildSettingsRepository');
const botRegistry = require('../discord/botRegistry');
const config = require('../config');

const ADMIN = BigInt(0x8);

function parseRoleIds(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return String(value).split(',').map((s) => s.trim()).filter(Boolean);
  }
}

function isDevUser(userId) {
  return config.dashboard.devUserIds.includes(userId);
}

function memberHasRoleAccess(member, settings) {
  const minRoleId = settings.dashboard_min_role_id;
  const allowedIds = parseRoleIds(settings.dashboard_allowed_role_ids);
  if (!minRoleId && !allowedIds.length) return false;

  if (allowedIds.some((id) => member.roles.cache.has(id))) return true;

  if (minRoleId) {
    const minRole = member.guild.roles.cache.get(minRoleId);
    if (!minRole) return false;
    if (member.roles.cache.has(minRoleId)) return true;
    return member.roles.highest.position >= minRole.position;
  }

  return false;
}

function getBotGuildList() {
  const client = botRegistry.getClient();
  const ids = botRegistry.getGuildIds();
  return [...ids].map((id) => {
    const guild = client?.guilds?.cache?.get(id);
    return { id, name: guild?.name || id };
  });
}

/**
 * Guilds the user may open in the web dashboard.
 * - Dev users: every server the bot is in
 * - Discord Administrators: always (when bot is installed)
 * - Others: dashboard_min_role_id and/or dashboard_allowed_role_ids in guild settings
 */
async function resolveAccessibleGuilds(userId, oauthGuilds) {
  if (isDevUser(userId)) {
    return getBotGuildList().map((g) => ({ ...g, access: 'dev' }));
  }

  const client = botRegistry.getClient();
  const guildList = Array.isArray(oauthGuilds) ? oauthGuilds : [];
  const accessible = [];

  for (const g of guildList) {
    if (!botRegistry.isBotInGuild(g.id)) continue;

    const isAdmin = (BigInt(g.permissions || 0) & ADMIN) === ADMIN;
    if (isAdmin) {
      accessible.push({ id: g.id, name: g.name, access: 'admin' });
      continue;
    }

    const settings = GuildSettingsRepository.get(g.id);
    const hasRoleConfig = settings.dashboard_min_role_id
      || parseRoleIds(settings.dashboard_allowed_role_ids).length;
    if (!hasRoleConfig) continue;

    const guild = client?.guilds?.cache?.get(g.id);
    if (!guild) continue;

    try {
      const member = await guild.members.fetch(userId);
      if (memberHasRoleAccess(member, settings)) {
        accessible.push({ id: g.id, name: g.name, access: 'role' });
      }
    } catch {
      // Not a member of this server
    }
  }

  return accessible;
}

/** Drop guilds the bot left since login. */
function filterStillInstalled(guilds) {
  return (guilds || []).filter((g) => botRegistry.isBotInGuild(g.id));
}

function canManageDashboardAccess(user, guildEntry) {
  if (isDevUser(user.id)) return true;
  return guildEntry?.access === 'admin';
}

module.exports = {
  parseRoleIds,
  isDevUser,
  memberHasRoleAccess,
  getBotGuildList,
  resolveAccessibleGuilds,
  filterStillInstalled,
  canManageDashboardAccess,
};
