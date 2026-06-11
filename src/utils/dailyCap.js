/** daily_xp_cap <= 0 means no daily limit */
function isDailyCapEnabled(settings) {
  return (settings?.daily_xp_cap ?? 0) > 0;
}

function dailyCapLimit(settings) {
  return settings?.daily_xp_cap ?? 0;
}

function formatDailyCapProgress(user, settings) {
  const earned = user.daily_xp_earned || 0;
  if (!isDailyCapEnabled(settings)) {
    return `Daily **${earned.toLocaleString()}** XP (no cap)`;
  }
  const cap = dailyCapLimit(settings);
  const remaining = Math.max(0, cap - earned);
  return `Daily **${earned}/${cap}** (${remaining} left)`;
}

module.exports = { isDailyCapEnabled, dailyCapLimit, formatDailyCapProgress };
