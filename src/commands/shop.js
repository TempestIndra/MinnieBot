const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ShopRepository = require('../repositories/ShopRepository');

module.exports = {
  data: new SlashCommandBuilder().setName('shop').setDescription('View the role shop'),
  async execute(interaction) {
    const items = ShopRepository.getAll(interaction.guild.id);
    const embed = new EmbedBuilder().setTitle('Role Shop').setColor(0xfee75c);
    embed.setDescription(items.length ? items.map((i) => `<@&${i.role_id}> — **${i.cost}** coins`).join('\n') : 'No roles in the shop yet.');
    await interaction.reply({ embeds: [embed] });
  },
};
