const { getDatabase } = require('../database/connection');
const { todayKey } = require('../utils/dates');

const DEFAULT_QUESTS = [
  { quest_key: 'voice_30', title: 'Voice Explorer', quest_type: 'voice_minutes', target_value: 30, reward_xp: 50, reward_coins: 25 },
  { quest_key: 'voice_60', title: 'Voice Veteran', quest_type: 'voice_minutes', target_value: 60, reward_xp: 100, reward_coins: 50 },
  { quest_key: 'messages_25', title: 'Chatterbox', quest_type: 'messages', target_value: 25, reward_xp: 75, reward_coins: 30 },
  { quest_key: 'xp_100', title: 'Daily Grind', quest_type: 'xp_earned', target_value: 100, reward_xp: 50, reward_coins: 20 },
  { quest_key: 'xp_250', title: 'Power User', quest_type: 'xp_earned', target_value: 250, reward_xp: 100, reward_coins: 40 },
  { quest_key: 'voice_social', title: 'Social Butterfly', quest_type: 'voice_with_others', target_value: 1, reward_xp: 60, reward_coins: 35 },
];

class QuestRepository {
  ensureDefaults(guildId) {
    for (const q of DEFAULT_QUESTS) {
      getDatabase().prepare(`
        INSERT OR IGNORE INTO quests (guild_id, quest_key, title, quest_type, target_value, reward_xp, reward_coins, is_daily)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      `).run(guildId, q.quest_key, q.title, q.quest_type, q.target_value, q.reward_xp, q.reward_coins);
    }
  }

  getDailyQuests(guildId) {
    this.ensureDefaults(guildId);
    return getDatabase().prepare('SELECT * FROM quests WHERE guild_id=? AND is_daily=1 AND is_active=1').all(guildId);
  }

  getProgress(userId, guildId, questId, date = todayKey()) {
    return getDatabase().prepare(`
      SELECT * FROM quest_progress WHERE user_id=? AND guild_id=? AND quest_id=? AND quest_date=?
    `).get(userId, guildId, questId, date);
  }

  upsertProgress(userId, guildId, questId, progress, completed = false) {
    const date = todayKey();
    getDatabase().prepare(`
      INSERT INTO quest_progress (user_id, guild_id, quest_id, progress, completed, quest_date)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, guild_id, quest_id, quest_date)
      DO UPDATE SET progress=excluded.progress, completed=excluded.completed, updated_at=datetime('now')
    `).run(userId, guildId, questId, progress, completed ? 1 : 0, date);
  }

  claim(userId, guildId, questId) {
    const date = todayKey();
    getDatabase().prepare(`
      UPDATE quest_progress SET claimed=1 WHERE user_id=? AND guild_id=? AND quest_id=? AND quest_date=?
    `).run(userId, guildId, questId, date);
  }

  isClaimed(userId, guildId, questId) {
    const p = this.getProgress(userId, guildId, questId);
    return p?.claimed === 1;
  }
}

module.exports = new QuestRepository();
