const { SlashCommandBuilder } = require('discord.js');
const { buildDashboardPayload } = require('../services/DashboardLinkService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dashboard')
    .setDescription('Get the link to the Minnie XP admin dashboard'),
  async execute(interaction) {
    const payload = buildDashboardPayload(interaction.guild);
    await interaction.reply({ ...payload, ephemeral: true });
  },
};
