const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const XpService = require('../services/XpService');
const LevelService = require('../services/LevelService');
const { isAdmin } = require('../utils/permissions');
const { displayName } = require('../utils/usernames');

const REASON_MESSAGES = {
  no_channel_configured: 'No **level-up channel** set. Add one in the web dashboard → XP Configuration → Announcements.',
  channel_not_found: 'Level-up channel ID is invalid or the bot cannot see that channel.',
  missing_permissions: 'Minnie cannot send messages in the level-up channel. Give the bot **View Channel**, **Send Messages**, and **Embed Links** there.',
  send_failed: 'Failed to post in the level-up channel. Check bot permissions and channel ID.',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('levelup')
    .setDescription('Promote a member to the next level (Administrators only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((o) =>
      o.setName('user').setDescription('Member to level up').setRequired(true)),
  async execute(interaction) {
    if (!isAdmin(interaction)) {
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
