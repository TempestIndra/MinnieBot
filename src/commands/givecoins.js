const { SlashCommandBuilder } = require('discord.js');
const EconomyService = require('../services/EconomyService');
const { isAdmin } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('givecoins')
    .setDescription('Give coins to a user')
    .addUserOption((o) => o.setName('user').setDescription('Recipient').setRequired(true))
    .addIntegerOption((o) => o.setName('amount').setDescription('Amount').setRequired(true).setMinValue(1)),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');
    if (interaction.user.id !== user.id && !isAdmin(interaction)) {
      return interaction.reply({ content: 'You can only give your own coins without admin.', ephemeral: true });
    }
    EconomyService.removeCoins(interaction.user.id, interaction.guild.id, amount, interaction.user.id);
    EconomyService.addCoins(user.id, interaction.guild.id, amount, 'give');
    await interaction.reply({ content: `Transferred **${amount}** coins to ${user.username}.` });
  },
};
