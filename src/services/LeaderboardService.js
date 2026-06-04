const UserRepository = require('../repositories/UserRepository');

const TYPE_MAP = {
  weekly: 'weekly_xp',
  season: 'seasonal_xp',
  alltime: 'total_xp',
};

const SOURCE_MAP = {
  total: 'total_xp',
  voice: 'voice_xp',
  text: 'text_xp',
};

class LeaderboardService {
  get(guildId, type = 'alltime', source = 'total', limit = 10) {
    let orderBy = SOURCE_MAP[source] || 'total_xp';
    if (type === 'weekly') orderBy = 'weekly_xp';
    else if (type === 'season') orderBy = 'seasonal_xp';
    else if (type === 'alltime' && source !== 'total') orderBy = SOURCE_MAP[source];

    return UserRepository.getLeaderboard(guildId, { orderBy, limit });
  }
}

module.exports = new LeaderboardService();
