const UserRepository = require('../repositories/UserRepository');
const LogRepository = require('../repositories/LogRepository');
const { getDatabase } = require('../database/connection');
const { seasonKey } = require('../utils/dates');

class ResetService {
  weeklyReset(guildId, adminId = 'system') {
    UserRepository.resetWeekly(guildId);
    LogRepository.logAdmin(guildId, adminId, 'weekly_reset', null, null);
  }

  seasonReset(guildId, adminId = 'system') {
    const users = UserRepository.getLeaderboard(guildId, { orderBy: 'seasonal_xp', limit: 100 });
    const key = seasonKey();
    const db = getDatabase();
    users.forEach((u, i) => {
      db.prepare(`
        INSERT INTO seasonal_leaderboards (guild_id, season_key, user_id, username, total_xp, rank)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(guild_id, season_key, user_id) DO UPDATE SET total_xp=excluded.total_xp, rank=excluded.rank
      `).run(guildId, key, u.user_id, u.username, u.seasonal_xp, i + 1);
    });
    UserRepository.resetSeasonal(guildId);
    LogRepository.logAdmin(guildId, adminId, 'season_reset', null, key);
  }

  resetAllGuilds(client, type) {
    for (const guild of client.guilds.cache.values()) {
      if (type === 'weekly') this.weeklyReset(guild.id);
      else this.seasonReset(guild.id);
    }
  }
}

module.exports = new ResetService();
