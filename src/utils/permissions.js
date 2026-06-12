const { PermissionFlagsBits } = require('discord.js');
const config = require('../config');

function isDevUser(userId) {
  return config.dashboard.devUserIds.includes(userId);
}

function isAdmin(interaction) {
  return interaction.memberPermissions?.has(PermissionFlagsBits.Administrator);
}

/** Server admins or DASHBOARD_DEV_USER_IDS */
function canUseAdminCommands(interaction) {
  return isAdmin(interaction) || isDevUser(interaction.user.id);
}

module.exports = { isAdmin, isDevUser, canUseAdminCommands };
