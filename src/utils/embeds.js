const { EmbedBuilder } = require('discord.js');
const { xpRequiredForLevel, xpProgressInLevel } = require('./level');

function profileEmbed(user, rank, settings) {
  const { current, needed } = xpProgressInLevel(user.total_xp, user.level);
  const dailyCap = settings?.daily_xp_cap ?? 500;
  const remainingDaily = Math.max(0, dailyCap - (user.daily_xp_earned || 0));

  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`${user.username}'s Profile`)
    .setDescription(`Rank **#${rank}**`)
    .addFields(
      { name: 'General', value: `Level **${user.level}** | Prestige **${user.prestige}**\nTotal XP **${user.total_xp.toLocaleString()}**`, inline: false },
      { name: 'Voice', value: `Voice XP **${user.voice_xp.toLocaleString()}**\nVoice Time **${formatVoiceTime(user.voice_time_seconds)}**`, inline: true },
      { name: 'Text', value: `Text XP **${user.text_xp.toLocaleString()}**\nMessages **${user.message_count.toLocaleString()}**`, inline: true },
      { name: 'Progression', value: `Weekly **${user.weekly_xp.toLocaleString()}** | Season **${user.seasonal_xp.toLocaleString()}**\nNext Level **${current}/${needed}** XP\nDaily **${user.daily_xp_earned}/${dailyCap}** (${remainingDaily} left)`, inline: false },
      { name: 'Economy', value: `Coins **${user.coins.toLocaleString()}** | Streak **${user.streak_count}** days`, inline: false }
    )
    .setTimestamp();
}

function leaderboardEmbed(title, rows, source) {
  const lines = rows.length
    ? rows.map((r, i) => {
        const xp = source === 'voice' ? r.voice_xp : source === 'text' ? r.text_xp : r.total_xp;
        return `**${i + 1}.** ${r.username} — Lv.${r.level} P${r.prestige} — **${xp.toLocaleString()}** XP`;
      }).join('\n')
    : 'No data yet.';

  return new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle(title)
    .setDescription(lines)
    .setTimestamp();
}

function formatVoiceTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

module.exports = { profileEmbed, leaderboardEmbed, formatVoiceTime };
