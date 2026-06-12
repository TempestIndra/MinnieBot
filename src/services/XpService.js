const config = require('../config');
const UserRepository = require('../repositories/UserRepository');
const GuildSettingsRepository = require('../repositories/GuildSettingsRepository');
const LogRepository = require('../repositories/LogRepository');
const { levelFromTotalXp, totalXpForLevel } = require('../utils/level');
const { isDailyCapEnabled, dailyCapLimit } = require('../utils/dailyCap');

/** Lazy-load to avoid circular dependency with QuestService / StreakService */
function getQuestService() {
  return require('./QuestService');
}
function getStreakService() {
  return require('./StreakService');
}

let realtimeEmitter = null;

function setRealtimeEmitter(emitter) {
  realtimeEmitter = emitter;
}

class XpService {
  /**
   * Award XP with daily cap, prestige multiplier, logging.
   * Returns { awarded, capped, leveledUp, oldLevel, newLevel, user }
   */
  award(userId, guildId, { amount, source, username, voice = 0, text = 0, voiceTime = 0, messages = 0, skipDailyCap = false }) {
    if (amount <= 0) return { awarded: 0, capped: true };

    const settings = GuildSettingsRepository.get(guildId);
    let user = UserRepository.getOrCreate(userId, guildId, username);

    const prestigeMult = config.prestige.enabled
      ? 1 + (user.prestige * ((settings.prestige_xp_multiplier || 1.1) - 1) * 0.1)
      : 1;
    let finalAmount = Math.floor(amount * prestigeMult);

    if (!skipDailyCap && isDailyCapEnabled(settings)) {
      const remaining = Math.max(0, dailyCapLimit(settings) - user.daily_xp_earned);
      if (remaining <= 0) return { awarded: 0, capped: true, reason: 'daily_cap' };
      if (finalAmount > remaining) finalAmount = remaining;
    }

    const oldLevel = user.level;
    const vXp = voice || (source === 'voice' ? finalAmount : 0);
    const tXp = text || (source === 'text' ? finalAmount : 0);

    user = UserRepository.addXp(userId, guildId, {
      total: finalAmount,
      voice: vXp,
      text: tXp,
      weekly: finalAmount,
      seasonal: finalAmount,
      daily: finalAmount,
      voiceTime,
      messages,
    });

    const coinRate = source === 'voice' ? settings.coin_voice_rate : settings.coin_text_rate;
    const coinMult = config.prestige.enabled
      ? 1 + user.prestige * ((settings.prestige_coin_multiplier || 1.1) - 1) * 0.1)
      : 1;
    const coins = Math.floor(finalAmount * coinRate * coinMult);
    if (coins > 0) {
      UserRepository.update(userId, guildId, { coins: user.coins + coins });
      LogRepository.logCoins(userId, guildId, coins, source, `From ${finalAmount} XP`);
      user.coins += coins;
    }

    LogRepository.logXp(userId, guildId, finalAmount, source, null);
    if (source === 'text') LogRepository.logTextXp(userId, guildId, null, null, finalAmount);

    getStreakService().recordActivity(userId, guildId);
    getQuestService().trackXpEarned(userId, guildId, finalAmount);
    if (voiceTime) getQuestService().trackVoiceMinutes(userId, guildId, Math.floor(voiceTime / 60));

    const leveledUp = user.level > oldLevel;

    if (realtimeEmitter) {
      realtimeEmitter.emit('xp:update', { guildId, userId, amount: finalAmount, source, user });
      if (leveledUp) realtimeEmitter.emit('level:up', { guildId, userId, oldLevel, newLevel: user.level });
    }

    return {
      awarded: finalAmount,
      capped: false,
      leveledUp,
      oldLevel,
      newLevel: user.level,
      user,
      coins,
    };
  }

  /**
   * Admin: bump member exactly one level and trigger level-up flow (roles + channel banner).
   */
  adminForceLevelUp(userId, guildId, adminId) {
    const settings = GuildSettingsRepository.get(guildId);
    const user = UserRepository.getOrCreate(userId, guildId);
    const oldLevel = user.level;

    const newLevel = oldLevel + 1;
    const newTotalXp = totalXpForLevel(newLevel);

    UserRepository.update(userId, guildId, {
      total_xp: Math.max(user.total_xp, newTotalXp),
      level: newLevel,
    });

    LogRepository.logAdmin(guildId, adminId, 'force_level_up', userId, `${oldLevel} -> ${newLevel}`);
    const updated = UserRepository.getOrCreate(userId, guildId);

    if (realtimeEmitter) {
      realtimeEmitter.emit('xp:update', { guildId, userId, amount: 0, source: 'admin', user: updated });
      realtimeEmitter.emit('level:up', { guildId, userId, oldLevel, newLevel });
    }

    return { ok: true, oldLevel, newLevel, user: updated };
  }

  adminAdjust(userId, guildId, amount, adminId) {
    const user = UserRepository.getOrCreate(userId, guildId);
    const newTotal = Math.max(0, user.total_xp + amount);
    const newLevel = levelFromTotalXp(newTotal);
    UserRepository.update(userId, guildId, { total_xp: newTotal, level: newLevel });
    LogRepository.logAdmin(guildId, adminId, amount > 0 ? 'add_xp' : 'remove_xp', userId, String(amount));
    LogRepository.logXp(userId, guildId, amount, 'admin', `By ${adminId}`);
    return UserRepository.getOrCreate(userId, guildId);
  }

  resetXp(userId, guildId, adminId) {
    UserRepository.update(userId, guildId, {
      total_xp: 0, voice_xp: 0, text_xp: 0, weekly_xp: 0, seasonal_xp: 0, level: 1, daily_xp_earned: 0,
    });
    LogRepository.logAdmin(guildId, adminId, 'reset_xp', userId, null);
    return UserRepository.getOrCreate(userId, guildId);
  }

  getXpToNextLevel(user) {
    const { xpProgressInLevel } = require('../utils/level');
    const p = xpProgressInLevel(user.total_xp, user.level);
    return p.needed - p.current;
  }
}

const xpService = new XpService();
xpService.setRealtimeEmitter = setRealtimeEmitter;
module.exports = xpService;
