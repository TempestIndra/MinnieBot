const { SlashCommandBuilder } = require('discord.js');
const PrestigeService = require('../services/PrestigeService');

module.exports = {
  data: new SlashCommandBuilder().setName('prestige').setDescription('Prestige at max level'),
  async execute(interaction) {
    const result = await PrestigeService.prestige(interaction.guild, interaction.member);
    if (!result.ok) {
      return interaction.reply({ content: `Cannot prestige: ${result.reason}`, ephemeral: true });
    }
    await interaction.reply({ content: `🌟 You are now **Prestige ${result.prestige}**! Level reset. Multipliers increased.` });
  },
};
