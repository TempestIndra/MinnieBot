const { SlashCommandBuilder } = require('discord.js');
const LeaderboardService = require('../services/LeaderboardService');
const { leaderboardEmbed } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View server leaderboards')
    .addStringOption((o) =>
      o.setName('type').setDescription('Leaderboard period').setRequired(true)
        .addChoices(
          { name: 'Weekly', value: 'weekly' },
          { name: 'Season', value: 'season' },
          { name: 'All Time', value: 'alltime' }
        ))
    .addStringOption((o) =>
      o.setName('source').setDescription('XP source').setRequired(true)
        .addChoices(
          { name: 'Total', value: 'total' },
          { name: 'Voice', value: 'voice' },
          { name: 'Text', value: 'text' }
        )),
  async execute(interaction) {
    const type = interaction.options.getString('type');
    const source = interaction.options.getString('source');
    await interaction.deferReply();
    const rows = await LeaderboardService.getEnriched(interaction.guild, type, source, 10);
    const title = `${interaction.guild.name} — ${type} ${source} leaderboard`;
    await interaction.editReply({ embeds: [leaderboardEmbed(title, rows, source)] });
  },
};
