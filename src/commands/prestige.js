const { SlashCommandBuilder } = require('discord.js');
const PrestigeService = require('../services/PrestigeService');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder().setName('prestige').setDescription('Prestige at max level'),
  async execute(interaction) {
    if (!config.prestige.enabled) {
      return interaction.reply({ content: 'Prestige is currently disabled on this server.', ephemeral: true });
    }
    const result = await PrestigeService.prestige(interaction.guild, interaction.member);
    if (!result.ok) {
      const msg = result.reason === 'disabled'
        ? 'Prestige is currently disabled on this server.'
        : `Cannot prestige: ${result.reason}`;
      return interaction.reply({ content: msg, ephemeral: true });
    }
    await interaction.reply({ content: `🌟 You are now **Prestige ${result.prestige}**! Level reset. Multipliers increased.` });
  },
};
