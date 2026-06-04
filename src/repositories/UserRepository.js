const { getDatabase } = require('../database/connection');
const { levelFromTotalXp } = require('../utils/level');
const { todayKey } = require('../utils/dates');

class UserRepository {
  getOrCreate(userId, guildId, username = 'Unknown') {
    const db = getDatabase();
    let user = db.prepare('SELECT * FROM users WHERE user_id = ? AND guild_id = ?').get(userId, guildId);
    if (!user) {
      db.prepare(`
        INSERT INTO users (user_id, guild_id, username, daily_xp_reset_date)
        VALUES (?, ?, ?, ?)
      `).run(userId, guildId, username, todayKey());
      user = db.prepare('SELECT * FROM users WHERE user_id = ? AND guild_id = ?').get(userId, guildId);
    } else if (username && user.username !== username) {
      db.prepare('UPDATE users SET username = ?, updated_at = datetime(\'now\') WHERE user_id = ? AND guild_id = ?')
        .run(username, userId, guildId);
      user.username = username;
    }
    return this._resetDailyIfNeeded(user);
  }

  _resetDailyIfNeeded(user) {
    const today = todayKey();
    if (user.daily_xp_reset_date !== today) {
      getDatabase().prepare(`
        UPDATE users SET daily_xp_earned = 0, daily_xp_reset_date = ?, updated_at = datetime('now')
        WHERE user_id = ? AND guild_id = ?
      `).run(today, user.user_id, user.guild_id);
      user.daily_xp_earned = 0;
      user.daily_xp_reset_date = today;
    }
    return user;
  }

  update(userId, guildId, fields) {
    const allowed = [
      'username', 'total_xp', 'voice_xp', 'text_xp', 'weekly_xp', 'seasonal_xp',
      'level', 'prestige', 'coins', 'voice_time_seconds', 'daily_xp_earned',
      'last_activity', 'streak_count', 'last_streak_date', 'message_count',
    ];
    const sets = [];
    const values = [];
    for (const [k, v] of Object.entries(fields)) {
      if (allowed.includes(k)) {
        sets.push(`${k} = ?`);
        values.push(v);
      }
    }
    if (!sets.length) return this.getOrCreate(userId, guildId);
    sets.push("updated_at = datetime('now')");
    values.push(userId, guildId);
    getDatabase().prepare(`UPDATE users SET ${sets.join(', ')} WHERE user_id = ? AND guild_id = ?`).run(...values);
    return this.getOrCreate(userId, guildId);
  }

  addXp(userId, guildId, { voice = 0, text = 0, total = 0, weekly = 0, seasonal = 0, daily = 0, coins = 0, voiceTime = 0, messages = 0 }) {
    const user = this.getOrCreate(userId, guildId);
    const newTotal = user.total_xp + total;
    const newLevel = levelFromTotalXp(newTotal);
    this.update(userId, guildId, {
      total_xp: newTotal,
      voice_xp: user.voice_xp + voice,
      text_xp: user.text_xp + text,
      weekly_xp: user.weekly_xp + weekly,
      seasonal_xp: user.seasonal_xp + seasonal,
      daily_xp_earned: user.daily_xp_earned + daily,
      coins: user.coins + coins,
      voice_time_seconds: user.voice_time_seconds + voiceTime,
      message_count: user.message_count + messages,
      level: newLevel,
      last_activity: new Date().toISOString(),
    });
    return this.getOrCreate(userId, guildId);
  }

  getRank(userId, guildId, orderBy = 'total_xp') {
    const col = ['total_xp', 'weekly_xp', 'seasonal_xp', 'voice_xp', 'text_xp'].includes(orderBy) ? orderBy : 'total_xp';
    const db = getDatabase();
    const user = this.getOrCreate(userId, guildId);
    const row = db.prepare(`
      SELECT COUNT(*) + 1 AS rank FROM users WHERE guild_id = ? AND ${col} > ?
    `).get(guildId, user[col]);
    return row?.rank ?? 1;
  }

  getLeaderboard(guildId, { orderBy = 'total_xp', limit = 10 } = {}) {
    const col = ['total_xp', 'weekly_xp', 'seasonal_xp', 'voice_xp', 'text_xp'].includes(orderBy) ? orderBy : 'total_xp';
    return getDatabase().prepare(`
      SELECT * FROM users WHERE guild_id = ? ORDER BY ${col} DESC LIMIT ?
    `).all(guildId, limit);
  }

  search(guildId, query, limit = 20) {
    return getDatabase().prepare(`
      SELECT * FROM users WHERE guild_id = ? AND username LIKE ? ORDER BY total_xp DESC LIMIT ?
    `).all(guildId, `%${query}%`, limit);
  }

  resetUser(userId, guildId) {
    getDatabase().prepare(`
      UPDATE users SET total_xp=0, voice_xp=0, text_xp=0, weekly_xp=0, seasonal_xp=0,
        level=1, prestige=0, coins=0, voice_time_seconds=0, daily_xp_earned=0,
        streak_count=0, message_count=0, updated_at=datetime('now')
      WHERE user_id=? AND guild_id=?
    `).run(userId, guildId);
    return this.getOrCreate(userId, guildId);
  }

  resetWeekly(guildId) {
    getDatabase().prepare('UPDATE users SET weekly_xp = 0 WHERE guild_id = ?').run(guildId);
  }

  resetSeasonal(guildId) {
    getDatabase().prepare('UPDATE users SET seasonal_xp = 0 WHERE guild_id = ?').run(guildId);
  }

  getGuildStats(guildId) {
    return getDatabase().prepare(`
      SELECT COUNT(*) as user_count,
        COALESCE(SUM(total_xp),0) as total_xp,
        COALESCE(SUM(voice_time_seconds),0) as total_voice_time,
        COALESCE(SUM(message_count),0) as total_messages,
        COALESCE(SUM(voice_xp),0) as total_voice_xp,
        COALESCE(SUM(text_xp),0) as total_text_xp
      FROM users WHERE guild_id = ?
    `).get(guildId);
  }
}

module.exports = new UserRepository();
