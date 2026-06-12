const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const XpService = require('../services/XpService');
const LevelService = require('../services/LevelService');
const { isAdmin } = require('../utils/permissions');
const { displayName } = require('../utils/usernames');

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

    await LevelService.handleLevelUp(interaction.guild, member, result.oldLevel, result.newLevel);

    await interaction.reply({
      content: `Promoted **${displayName(member)}** from Level **${result.oldLevel}** → **${result.newLevel}**. Level-up announcement posted if a channel is configured.`,
      ephemeral: true,
    });
  },
};
