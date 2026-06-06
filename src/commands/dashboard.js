const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { buildDashboardPayload } = require('../services/DashboardLinkService');
const { isAdmin } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dashboard')
    .setDescription('Get the admin dashboard link (Administrators only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    if (!isAdmin(interaction)) {
      return interaction.reply({
        content: 'Only **Administrators** can access the Minnie dashboard.',
        ephemeral: true,
      });
    }
    const payload = buildDashboardPayload(interaction.guild);
    await interaction.reply({ ...payload, ephemeral: true });
  },
};
