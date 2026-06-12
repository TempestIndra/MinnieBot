const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const LevelRoleRepository = require('../repositories/LevelRoleRepository');
const LogRepository = require('../repositories/LogRepository');
const GuildSettingsRepository = require('../repositories/GuildSettingsRepository');
const botRegistry = require('../discord/botRegistry');
const logger = require('../utils/logger').child('levels');

async function resolveTextChannel(guild, channelId) {
  if (!channelId) return null;
  let channel = guild.channels.cache.get(channelId);
  if (!channel) {
    try {
      channel = await guild.channels.fetch(channelId);
    } catch (err) {
      logger.warn(`Could not fetch channel ${channelId}: ${err.message}`);
      return null;
    }
  }
  if (!channel?.isTextBased()) return null;
  if (typeof channel.isSendable === 'function' && !channel.isSendable()) return null;
  return channel;
}

async function resolveGuildMember(guildId, userId, context = {}) {
  if (context.guild && context.member) {
    return { guild: context.guild, member: context.member };
  }

  const client = botRegistry.getClient();
  if (!client) {
    logger.warn('Level-up: Discord client not ready');
    return null;
  }

  const guild = context.guild
    ?? client.guilds.cache.get(guildId)
    ?? await client.guilds.fetch(guildId).catch(() => null);
  if (!guild) {
    logger.warn(`Level-up: bot is not in guild ${guildId}`);
    return null;
  }

  const member = context.member
    ?? await guild.members.fetch(userId).catch(() => null);
  if (!member) {
    logger.warn(`Level-up: member ${userId} not found in guild ${guildId}`);
    return null;
  }

  return { guild, member };
}

class LevelService {
  /**
   * Announce every level gained from oldLevel+1 through newLevel (natural XP or admin).
   */
  async processLevelUps(guildId, userId, oldLevel, newLevel, context = {}) {
    const from = Number(oldLevel);
    const to = Number(newLevel);
    if (!guildId || !userId || to <= from) {
      return { ok: false, announced: 0, reason: 'no_level_change' };
    }

    const resolved = await resolveGuildMember(guildId, userId, context);
    if (!resolved) {
      return { ok: false, announced: 0, reason: 'member_not_found' };
    }

    const results = [];
    for (let level = from + 1; level <= to; level++) {
      results.push(await this.handleLevelUp(resolved.guild, resolved.member, level - 1, level));
    }

    const announced = results.filter((r) => r.announced).length;
    return { ok: true, announced, levels: to - from, results };
  }

  /** @deprecated use processLevelUps */
  async triggerForUser(guildId, userId, oldLevel, newLevel, context = {}) {
    return this.processLevelUps(guildId, userId, oldLevel, newLevel, context);
  }

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

    const channelId = (settings.level_up_channel_id || settings.log_channel_id || '').trim();
    if (!channelId) {
      logger.info(`Level-up Lv.${newLevel} for ${member.id}: no announcement channel configured`);
      return { ok: true, announced: false, reason: 'no_channel_configured', assigned };
    }

    const channel = await resolveTextChannel(guild, channelId);
    if (!channel) {
      logger.warn(`Level-up channel ${channelId} not found or not sendable in guild ${guild.id}`);
      return { ok: true, announced: false, reason: 'channel_not_found', channelId, assigned };
    }

    const me = guild.members.me ?? await guild.members.fetchMe().catch(() => null);
    const perms = channel.permissionsFor(me);
    if (!perms?.has(PermissionFlagsBits.SendMessages) || !perms?.has(PermissionFlagsBits.ViewChannel)) {
      logger.warn(`Missing permissions to send level-up message in channel ${channelId} (guild ${guild.id})`);
      return { ok: true, announced: false, reason: 'missing_permissions', channelId, assigned };
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
      logger.info(`Level-up announced: ${member.user.tag} → Lv.${newLevel} in #${channel.name}`);
      return { ok: true, announced: true, channelId, channelName: channel.name, assigned };
    } catch (err) {
      logger.warn(`Failed to send level-up message to ${channelId}: ${err.message}`);
      return { ok: true, announced: false, reason: 'send_failed', error: err.message, channelId, assigned };
    }
  }
}

module.exports = new LevelService();
