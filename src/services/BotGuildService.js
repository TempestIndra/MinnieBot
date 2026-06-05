const config = require('../config');
const botRegistry = require('../discord/botRegistry');

const DISCORD_API = 'https://discord.com/api/v10';

/**
 * Keep only guilds where the user is admin AND Minnie bot is installed.
 */
class BotGuildService {
  filterAdminGuildsWithBot(adminGuilds) {
    const botIds = botRegistry.getGuildIds();
    if (!botIds.size) return [];
    return adminGuilds.filter((g) => botIds.has(g.id));
  }

  /** When bot cache is not ready yet, verify each guild via REST */
  async filterAdminGuildsWithBotAsync(adminGuilds) {
    const botIds = botRegistry.getGuildIds();
    if (botIds.size > 0) {
      return adminGuilds.filter((g) => botIds.has(g.id));
    }

    const token = config.discord.token;
    if (!token) return [];

    const checks = await Promise.all(
      adminGuilds.map(async (guild) => {
        try {
          const res = await fetch(`${DISCORD_API}/guilds/${guild.id}`, {
            headers: { Authorization: `Bot ${token}` },
          });
          return res.ok ? guild : null;
        } catch {
          return null;
        }
      })
    );

    return checks.filter(Boolean);
  }
}

module.exports = new BotGuildService();
