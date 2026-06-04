const { SlashCommandBuilder } = require('discord.js');
const UserRepository = require('../repositories/UserRepository');
const { profileEmbed } = require('../utils/embeds');
const GuildSettingsRepository = require('../repositories/GuildSettingsRepository');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View your or another user\'s XP profile')
    .addUserOption((o) => o.setName('user').setDescription('User to view')),
  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    const user = UserRepository.getOrCreate(target.id, interaction.guild.id, target.username);
    const rank = UserRepository.getRank(target.id, interaction.guild.id);
    const settings = GuildSettingsRepository.get(interaction.guild.id);
    await interaction.reply({ embeds: [profileEmbed(user, rank, settings)] });
  },
};
