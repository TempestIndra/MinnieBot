const crypto = require('crypto');
const XpService = require('./XpService');
const ChannelEligibilityService = require('./ChannelEligibilityService');
const GuildSettingsRepository = require('../repositories/GuildSettingsRepository');
const LogRepository = require('../repositories/LogRepository');
const { getDatabase } = require('../database/connection');
const QuestService = require('./QuestService');

const cooldowns = new Map();
const recentHashes = new Map();

class TextXpService {
  async processMessage(message) {
    if (!message.guild || message.author.bot) return { awarded: 0 };
    if (!message.content || message.content.trim().length === 0) return { awarded: 0 };

    const guildId = message.guild.id;
    const userId = message.author.id;
    const settings = GuildSettingsRepository.get(guildId);

    if (message.content.trim().length < settings.min_message_length) {
      return { awarded: 0, reason: 'too_short' };
    }

    const eligibility = ChannelEligibilityService.canEarnXp(message.guild, message.channel.id, 'text');
    if (!eligibility.allowed) return { awarded: 0, reason: eligibility.reason };

    const hash = crypto.createHash('md5').update(message.content.trim().toLowerCase()).digest('hex');
    const hashKey = `${guildId}-${userId}`;
    if (recentHashes.get(hashKey) === hash) {
      LogRepository.logSuspicious(userId, guildId, 'duplicate_message', message.id);
      return { awarded: 0, reason: 'duplicate' };
    }

    const cdKey = `${guildId}-${userId}`;
    const lastXp = cooldowns.get(cdKey) || 0;
    if (Date.now() - lastXp < settings.text_cooldown * 1000) {
      return { awarded: 0, reason: 'cooldown' };
    }

    if (this._isSpamming(userId, guildId, settings)) {
      LogRepository.logSuspicious(userId, guildId, 'spam_detected', null);
      return { awarded: 0, reason: 'spam' };
    }

    const min = settings.text_xp_min;
    const max = settings.text_xp_max;
    let amount = Math.floor(Math.random() * (max - min + 1)) + min;
    amount = Math.floor(amount * (eligibility.multiplier || 1));

    const result = XpService.award(userId, guildId, {
      amount,
      source: 'text',
      username: message.author.username,
      text: amount,
      messages: 1,
    });

    if (result.awarded > 0) {
      cooldowns.set(cdKey, Date.now());
      recentHashes.set(hashKey, hash);
      LogRepository.logTextXp(userId, guildId, message.channel.id, message.id, result.awarded);
      QuestService.trackMessage(userId, guildId);
      this._recordMessage(userId, guildId);
    }

    return result;
  }

  _isSpamming(userId, guildId, settings) {
    const key = `${guildId}-${userId}`;
    const now = Date.now();
    let arr = this._spamBuffers?.get(key) || [];
    arr = arr.filter((t) => now - t < settings.anti_spam_window * 1000);
    arr.push(now);
    if (!this._spamBuffers) this._spamBuffers = new Map();
    this._spamBuffers.set(key, arr);
    return arr.length > settings.anti_spam_max_messages;
  }

  _recordMessage(userId, guildId) {
    getDatabase().prepare(`
      INSERT INTO user_text_state (user_id, guild_id, last_xp_at) VALUES (?,?,datetime('now'))
      ON CONFLICT(user_id, guild_id) DO UPDATE SET last_xp_at=datetime('now')
    `).run(userId, guildId);
  }
}

module.exports = new TextXpService();
