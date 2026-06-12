const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const XpService = require('../services/XpService');
const LevelService = require('../services/LevelService');
const { canUseAdminCommands, isDevUser } = require('../utils/permissions');
const { displayName } = require('../utils/usernames');

const REASON_MESSAGES = {
  no_channel_configured: 'No **level-up channel** set. Add one in the web dashboard → XP Configuration → Announcements.',
  wrong_guild_channel: 'The saved channel ID is from a **different Discord server**. In **this** server, right-click the channel → Copy Channel ID, paste in the dashboard, and Save.',
  channel_not_found: 'Level-up channel ID is invalid or the bot cannot see that channel in this server.',
  missing_permissions: 'Minnie cannot send messages in the level-up channel. Give the bot **View Channel**, **Send Messages**, and **Embed Links** there.',
  send_failed: 'Failed to post in the level-up channel. Check bot permissions and channel ID.',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('levelup')
    .setDescription('Promote a member to the next level (Administrators / bot developer)')
    // No setDefaultMemberPermissions — dev user IDs can use this in any server without Admin role
    .addUserOption((o) =>
      o.setName('user').setDescription('Member to level up').setRequired(true)),
  async execute(interaction) {
    if (!canUseAdminCommands(interaction)) {
      return interaction.reply({ content: 'Administrator permission required.', ephemeral: true });
    }

    const target = interaction.options.getUser('user');
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (!member) {
      return interaction.reply({ content: 'Member not found in this server.', ephemeral: true });
    }

    const result = XpService.adminForceLevelUp(target.id, interaction.guild.id, interaction.user.id);
    if (!result.ok) {
      return interaction.reply({ content: 'Could not level up that member.', ephemeral: true });
    }

    const announce = await LevelService.processLevelUps(
      interaction.guild.id,
      member.id,
      result.oldLevel,
      result.newLevel,
      { guild: interaction.guild, member }
    );

    let content = `Promoted **${displayName(member)}** from Level **${result.oldLevel}** → **${result.newLevel}**.`;
    if (isDevUser(interaction.user.id) && !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      content = `[Dev] ${content}`;
    }
    if (announce.announced > 0) {
      const last = announce.results?.[announce.results.length - 1];
      content += ` Announcement posted in **#${last?.channelName || 'channel'}**.`;
    } else {
      const reason = announce.results?.[0]?.reason || announce.reason;
      const hint = REASON_MESSAGES[reason] || 'Level-up announcement was not posted.';
      content += `\n\n⚠️ ${hint}`;
    }

    await interaction.reply({ content, ephemeral: true });
  },
};
