const { getDatabase } = require('../database/connection');

class LogRepository {
  logXp(userId, guildId, amount, source, details = null) {
    getDatabase().prepare('INSERT INTO xp_logs (user_id, guild_id, amount, source, details) VALUES (?,?,?,?,?)')
      .run(userId, guildId, amount, source, details);
  }

  logTextXp(userId, guildId, channelId, messageId, amount) {
    getDatabase().prepare('INSERT INTO text_xp_logs (user_id, guild_id, channel_id, message_id, amount) VALUES (?,?,?,?,?)')
      .run(userId, guildId, channelId, messageId, amount);
  }

  logCoins(userId, guildId, amount, source, details = null) {
    getDatabase().prepare('INSERT INTO coin_logs (user_id, guild_id, amount, source, details) VALUES (?,?,?,?,?)')
      .run(userId, guildId, amount, source, details);
  }

  logAdmin(guildId, adminId, action, targetId = null, details = null) {
    getDatabase().prepare('INSERT INTO admin_logs (guild_id, admin_id, action, target_id, details) VALUES (?,?,?,?,?)')
      .run(guildId, adminId, action, targetId, details);
  }

  logSuspicious(userId, guildId, reason, details = null) {
    getDatabase().prepare('INSERT INTO suspicious_sessions (user_id, guild_id, reason, details) VALUES (?,?,?,?)')
      .run(userId, guildId, reason, details);
  }

  getXpLogs(guildId, limit = 50) {
    return getDatabase().prepare('SELECT * FROM xp_logs WHERE guild_id=? ORDER BY id DESC LIMIT ?').all(guildId, limit);
  }

  getCoinLogs(guildId, limit = 50) {
    return getDatabase().prepare('SELECT * FROM coin_logs WHERE guild_id=? ORDER BY id DESC LIMIT ?').all(guildId, limit);
  }

  getAdminLogs(guildId, limit = 50) {
    return getDatabase().prepare('SELECT * FROM admin_logs WHERE guild_id=? ORDER BY id DESC LIMIT ?').all(guildId, limit);
  }

  getSuspicious(guildId, limit = 50) {
    return getDatabase().prepare('SELECT * FROM suspicious_sessions WHERE guild_id=? ORDER BY id DESC LIMIT ?').all(guildId, limit);
  }
}

module.exports = new LogRepository();
