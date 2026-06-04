const LevelRoleRepository = require('../repositories/LevelRoleRepository');
const LogRepository = require('../repositories/LogRepository');
const GuildSettingsRepository = require('../repositories/GuildSettingsRepository');

class LevelService {
  async handleLevelUp(guild, member, oldLevel, newLevel) {
    const settings = GuildSettingsRepository.get(guild.id);
    const roles = LevelRoleRepository.getEligible(guild.id, newLevel);
    const assigned = [];

    for (const lr of roles) {
      const role = guild.roles.cache.get(lr.role_id);
      if (!role) continue;
      if (member.roles.cache.has(role.id)) continue;
      try {
        await member.roles.add(role, `Level ${lr.level} reward`);
        assigned.push(role.id);
        LogRepository.logAdmin(guild.id, 'system', 'level_role_assigned', member.id, `Level ${lr.level} -> ${role.id}`);
      } catch (err) {
        console.error(`[LevelService] Failed to assign role ${role.id}:`, err.message);
      }
    }

    const channelId = settings.level_up_channel_id || settings.log_channel_id;
    if (channelId) {
      const channel = guild.channels.cache.get(channelId);
      if (channel?.isTextBased()) {
        await channel.send({
          content: `🎉 Congratulations ${member}! You reached **Level ${newLevel}**!`,
        }).catch(() => {});
      }
    }

    return assigned;
  }
}

module.exports = new LevelService();
