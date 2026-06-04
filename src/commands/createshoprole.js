const { SlashCommandBuilder } = require('discord.js');
const GuildConfigService = require('../services/GuildConfigService');
const { isAdmin } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('createshoprole')
    .setDescription('Add a role to the shop (Admin)')
    .addRoleOption((o) => o.setName('role').setDescription('Shop role').setRequired(true))
    .addIntegerOption((o) => o.setName('cost').setDescription('Cost in coins').setRequired(true).setMinValue(1))
    .addStringOption((o) => o.setName('description').setDescription('Optional description')),
  async execute(interaction) {
    if (!isAdmin(interaction)) return interaction.reply({ content: 'Admin only.', ephemeral: true });
    const role = interaction.options.getRole('role');
    GuildConfigService.createShopRole(interaction.guild.id, role.id, interaction.options.getInteger('cost'), role.name, interaction.options.getString('description'), interaction.user.id);
    await interaction.reply({ content: `Added **${role.name}** to the shop.` });
  },
};
