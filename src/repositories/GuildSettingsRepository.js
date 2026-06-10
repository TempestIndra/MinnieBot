const { getDatabase } = require('../database/connection');
const config = require('../config');

class GuildSettingsRepository {
  get(guildId) {
    const db = getDatabase();
    let row = db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?').get(guildId);
    if (!row) {
      db.prepare(`
        INSERT INTO guild_settings (guild_id, voice_xp_rate, text_xp_min, text_xp_max, text_cooldown, daily_xp_cap, min_message_length, max_level)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        guildId,
        config.defaults.voiceXpRate,
        config.defaults.textXpMin,
        config.defaults.textXpMax,
        config.defaults.textCooldown,
        config.defaults.dailyXpCap,
        config.defaults.minMessageLength,
        config.defaults.maxLevel
      );
      row = db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?').get(guildId);
    }
    return row;
  }

  update(guildId, fields) {
    const allowed = [
      'voice_xp_rate', 'text_xp_min', 'text_xp_max', 'text_cooldown', 'daily_xp_cap',
      'min_message_length', 'max_level', 'prestige_max', 'log_channel_id', 'level_up_channel_id',
      'prestige_role_id', 'coin_voice_rate', 'coin_text_rate', 'prestige_xp_multiplier',
      'prestige_coin_multiplier', 'anti_spam_window', 'anti_spam_max_messages', 'voice_afk_threshold_minutes',
      'dashboard_url', 'dashboard_link_text', 'dashboard_embed_title', 'dashboard_embed_description',
      'dashboard_min_role_id', 'dashboard_allowed_role_ids',
    ];
    const sets = [];
    const values = [];
    for (const [k, v] of Object.entries(fields)) {
      if (allowed.includes(k)) {
        sets.push(`${k} = ?`);
        values.push(v);
      }
    }
    if (!sets.length) return this.get(guildId);
    sets.push("updated_at = datetime('now')");
    values.push(guildId);
    getDatabase().prepare(`UPDATE guild_settings SET ${sets.join(', ')} WHERE guild_id = ?`).run(...values);
    return this.get(guildId);
  }
}

module.exports = new GuildSettingsRepository();
