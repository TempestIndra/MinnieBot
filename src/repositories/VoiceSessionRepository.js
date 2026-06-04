const { getDatabase } = require('../database/connection');

class VoiceSessionRepository {
  start(userId, guildId, channelId) {
    const r = getDatabase().prepare(`
      INSERT INTO voice_sessions (user_id, guild_id, channel_id, joined_at) VALUES (?,?,?,datetime('now'))
    `).run(userId, guildId, channelId);
    return r.lastInsertRowid;
  }

  end(sessionId, durationSeconds, xpEarned, isValid = true) {
    getDatabase().prepare(`
      UPDATE voice_sessions SET left_at=datetime('now'), duration_seconds=?, xp_earned=?, is_valid=?
      WHERE id=?
    `).run(durationSeconds, xpEarned, isValid ? 1 : 0, sessionId);
  }
}

module.exports = new VoiceSessionRepository();
