const { EmbedBuilder } = require('discord.js');
const LevelRoleRepository = require('../repositories/LevelRoleRepository');
const LogRepository = require('../repositories/LogRepository');
const GuildSettingsRepository = require('../repositories/GuildSettingsRepository');
const logger = require('../utils/logger').child('levels');

async function resolveTextChannel(guild, channelId) {
  if (!channelId) return null;
  let channel = guild.channels.cache.get(channelId);
  if (!channel) {
    try {
      channel = await guild.channels.fetch(channelId);
    } catch {
      return null;
    }
  }
  return channel?.isTextBased() ? channel : null;
}

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
        logger.warn(`Failed to assign role ${role.id}: ${err.message}`);
      }
    }

    const channelId = settings.level_up_channel_id || settings.log_channel_id;
    if (!channelId) return assigned;

    const channel = await resolveTextChannel(guild, channelId);
    if (!channel) {
      logger.warn(`Level-up channel ${channelId} not found or not text-based in guild ${guild.id}`);
      return assigned;
    }

    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle('Level Up!')
      .setDescription(`${member} reached **Level ${newLevel}**! 🎉`)
      .setThumbnail(member.user.displayAvatarURL({ size: 128 }));

    if (assigned.length) {
      embed.addFields({
        name: 'Rewards',
        value: assigned.map((id) => `<@&${id}>`).join(', '),
      });
    }

    try {
      await channel.send({ embeds: [embed] });
    } catch (err) {
      logger.warn(`Failed to send level-up message to ${channelId}: ${err.message}`);
    }

    return assigned;
  }
}

module.exports = new LevelService();
