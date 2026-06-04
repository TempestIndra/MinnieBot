const { SlashCommandBuilder } = require('discord.js');
const GuildConfigService = require('../services/GuildConfigService');
const { isAdmin } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removeshoprole')
    .setDescription('Remove a role from the shop (Admin)')
    .addRoleOption((o) => o.setName('role').setDescription('Role to remove').setRequired(true)),
  async execute(interaction) {
    if (!isAdmin(interaction)) return interaction.reply({ content: 'Admin only.', ephemeral: true });
    const role = interaction.options.getRole('role');
    GuildConfigService.removeShopRole(interaction.guild.id, role.id, interaction.user.id);
    await interaction.reply({ content: `Removed **${role.name}** from the shop.` });
  },
};
