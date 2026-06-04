/**
 * Data models / DTOs for API responses.
 * Repositories return raw DB rows; controllers shape these when needed.
 */

function userDto(row) {
  if (!row) return null;
  return {
    userId: row.user_id,
    guildId: row.guild_id,
    username: row.username,
    totalXp: row.total_xp,
    voiceXp: row.voice_xp,
    textXp: row.text_xp,
    weeklyXp: row.weekly_xp,
    seasonalXp: row.seasonal_xp,
    level: row.level,
    prestige: row.prestige,
    coins: row.coins,
    voiceTimeSeconds: row.voice_time_seconds,
    dailyXpEarned: row.daily_xp_earned,
    streakCount: row.streak_count,
    messageCount: row.message_count,
    lastActivity: row.last_activity,
  };
}

module.exports = { userDto };
