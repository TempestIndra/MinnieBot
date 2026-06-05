const UserRepository = require('../repositories/UserRepository');
const { todayKey, yesterdayKey } = require('../utils/dates');
const EconomyService = require('./EconomyService');

class StreakService {
  recordActivity(userId, guildId) {
    const user = UserRepository.getOrCreate(userId, guildId);
    const today = todayKey();
    const yesterday = yesterdayKey();

    if (user.last_streak_date === today) return user;

    const wasYesterday = user.last_streak_date === yesterday;
    const streak = wasYesterday ? user.streak_count + 1 : 1;

    UserRepository.update(userId, guildId, { streak_count: streak, last_streak_date: today });

    if (streak > 1) {
      const bonusXp = Math.min(50, streak * 5);
      const bonusCoins = Math.min(25, streak * 2);
      require('./XpService').award(userId, guildId, { amount: bonusXp, source: 'streak', skipDailyCap: true });
      EconomyService.addCoins(userId, guildId, bonusCoins, 'streak');
    }

    return UserRepository.getOrCreate(userId, guildId);
  }
}

module.exports = new StreakService();
