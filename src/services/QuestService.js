const QuestRepository = require('../repositories/QuestRepository');
const UserRepository = require('../repositories/UserRepository');
const XpService = require('./XpService');
const EconomyService = require('./EconomyService');
const { todayKey } = require('../utils/dates');

const dailyTrackers = new Map();

function trackerKey(userId, guildId) {
  return `${guildId}-${userId}-${todayKey()}`;
}

class QuestService {
  _getTracker(userId, guildId) {
    const key = trackerKey(userId, guildId);
    if (!dailyTrackers.has(key)) {
      dailyTrackers.set(key, { voiceMinutes: 0, messages: 0, xpEarned: 0, voiceWithOthers: false });
    }
    return dailyTrackers.get(key);
  }

  trackVoiceMinutes(userId, guildId, minutes) {
    const t = this._getTracker(userId, guildId);
    t.voiceMinutes += minutes;
    this._syncProgress(userId, guildId);
  }

  trackMessage(userId, guildId) {
    const t = this._getTracker(userId, guildId);
    t.messages += 1;
    this._syncProgress(userId, guildId);
  }

  trackXpEarned(userId, guildId, xp) {
    const t = this._getTracker(userId, guildId);
    t.xpEarned += xp;
    this._syncProgress(userId, guildId);
  }

  trackVoiceWithOthers(userId, guildId) {
    const t = this._getTracker(userId, guildId);
    t.voiceWithOthers = true;
    this._syncProgress(userId, guildId);
  }

  _syncProgress(userId, guildId) {
    const t = this._getTracker(userId, guildId);
    const quests = QuestRepository.getDailyQuests(guildId);

    for (const q of quests) {
      let progress = 0;
      switch (q.quest_type) {
        case 'voice_minutes': progress = t.voiceMinutes; break;
        case 'messages': progress = t.messages; break;
        case 'xp_earned': progress = t.xpEarned; break;
        case 'voice_with_others': progress = t.voiceWithOthers ? 1 : 0; break;
        default: break;
      }
      const completed = progress >= q.target_value;
      QuestRepository.upsertProgress(userId, guildId, q.id, progress, completed);
    }
  }

  getQuestsForUser(userId, guildId) {
    QuestRepository.ensureDefaults(guildId);
    const quests = QuestRepository.getDailyQuests(guildId);
    return quests.map((q) => {
      const p = QuestRepository.getProgress(userId, guildId, q.id);
      return {
        ...q,
        progress: p?.progress ?? 0,
        completed: p?.completed === 1,
        claimed: p?.claimed === 1,
      };
    });
  }

  claimQuest(userId, guildId, questId) {
    const q = QuestRepository.getDailyQuests(guildId).find((x) => x.id === questId);
    if (!q) return { ok: false, reason: 'not_found' };

    const p = QuestRepository.getProgress(userId, guildId, questId);
    if (!p || !p.completed) return { ok: false, reason: 'not_completed' };
    if (p.claimed) return { ok: false, reason: 'already_claimed' };

    QuestRepository.claim(userId, guildId, questId);
    if (q.reward_xp) XpService.award(userId, guildId, { amount: q.reward_xp, source: 'quest', skipDailyCap: true });
    if (q.reward_coins) EconomyService.addCoins(userId, guildId, q.reward_coins, 'quest');

    return { ok: true, rewards: { xp: q.reward_xp, coins: q.reward_coins } };
  }
}

module.exports = new QuestService();
