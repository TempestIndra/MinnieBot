const { PermissionFlagsBits } = require('discord.js');

function isAdmin(interaction) {
  return interaction.memberPermissions?.has(PermissionFlagsBits.Administrator);
}

module.exports = { isAdmin };
