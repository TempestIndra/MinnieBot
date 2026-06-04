const { SlashCommandBuilder } = require('discord.js');
const EconomyService = require('../services/EconomyService');
const { isAdmin } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check your coin balance'),
  async execute(interaction) {
    const coins = EconomyService.getBalance(interaction.user.id, interaction.guild.id);
    await interaction.reply({ content: `💰 You have **${coins.toLocaleString()}** coins.`, ephemeral: true });
  },
};

// Separate files for givecoins etc - use admin group command file
