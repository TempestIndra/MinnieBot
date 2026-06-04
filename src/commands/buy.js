const { SlashCommandBuilder } = require('discord.js');
const EconomyService = require('../services/EconomyService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Purchase a role from the shop')
    .addRoleOption((o) => o.setName('role').setDescription('Role to buy').setRequired(true)),
  async execute(interaction) {
    const role = interaction.options.getRole('role');
    const result = await EconomyService.buyRole(interaction.guild, interaction.member, role.id);
    if (!result.ok) return interaction.reply({ content: `Purchase failed: ${result.reason}`, ephemeral: true });
    await interaction.reply({ content: `✅ Purchased <@&${role.id}> for **${result.cost}** coins!` });
  },
};
