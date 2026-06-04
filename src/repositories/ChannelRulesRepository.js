const { getDatabase } = require('../database/connection');

class ChannelRulesRepository {
  setChannelRule(guildId, channelId, ruleType, appliesTo = 'both') {
    getDatabase().prepare(`
      INSERT INTO channel_rules (guild_id, channel_id, rule_type, applies_to)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(guild_id, channel_id, rule_type) DO UPDATE SET applies_to = excluded.applies_to
    `).run(guildId, channelId, ruleType, appliesTo);
  }

  removeChannelRule(guildId, channelId, ruleType) {
    getDatabase().prepare('DELETE FROM channel_rules WHERE guild_id=? AND channel_id=? AND rule_type=?')
      .run(guildId, channelId, ruleType);
  }

  getChannelRules(guildId) {
    return getDatabase().prepare('SELECT * FROM channel_rules WHERE guild_id = ?').all(guildId);
  }

  setCategoryRule(guildId, categoryId, ruleType, appliesTo) {
    getDatabase().prepare(`
      INSERT INTO category_rules (guild_id, category_id, rule_type, applies_to)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(guild_id, category_id, rule_type, applies_to) DO NOTHING
    `).run(guildId, categoryId, ruleType, appliesTo);
  }

  removeCategoryRule(guildId, categoryId, ruleType, appliesTo) {
    getDatabase().prepare(`
      DELETE FROM category_rules WHERE guild_id=? AND category_id=? AND rule_type=? AND applies_to=?
    `).run(guildId, categoryId, ruleType, appliesTo);
  }

  getCategoryRules(guildId) {
    return getDatabase().prepare('SELECT * FROM category_rules WHERE guild_id = ?').all(guildId);
  }

  setBonus(guildId, channelId, multiplier, appliesTo = 'both') {
    getDatabase().prepare(`
      INSERT INTO bonus_channels (guild_id, channel_id, multiplier, applies_to)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(guild_id, channel_id) DO UPDATE SET multiplier = excluded.multiplier, applies_to = excluded.applies_to
    `).run(guildId, channelId, multiplier, appliesTo);
  }

  removeBonus(guildId, channelId) {
    getDatabase().prepare('DELETE FROM bonus_channels WHERE guild_id=? AND channel_id=?').run(guildId, channelId);
  }

  getBonusChannels(guildId) {
    return getDatabase().prepare('SELECT * FROM bonus_channels WHERE guild_id = ?').all(guildId);
  }

  getBonusMultiplier(guildId, channelId, type) {
    const row = getDatabase().prepare('SELECT * FROM bonus_channels WHERE guild_id=? AND channel_id=?').get(guildId, channelId);
    if (!row) return 1;
    if (row.applies_to === 'both' || row.applies_to === type) return row.multiplier;
    return 1;
  }
}

module.exports = new ChannelRulesRepository();
