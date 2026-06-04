const profile = require('./profile');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('View your or another user\'s rank profile')
    .addUserOption((o) => o.setName('user').setDescription('User to view')),
  execute: profile.execute,
};
