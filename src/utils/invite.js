const { PermissionFlagsBits } = require('discord.js');
const config = require('../config');
const logger = require('./logger').child('invite');

/** Permissions Minnie needs in each server (combine as BigInt for discord.js v14) */
const BOT_PERMISSION_FLAGS = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.EmbedLinks,
  PermissionFlagsBits.ReadMessageHistory,
  PermissionFlagsBits.ManageRoles,
];

const BOT_PERMISSIONS = BOT_PERMISSION_FLAGS.reduce(
  (acc, flag) => acc | BigInt(flag),
  0n
);

/**
 * Bot invite — use OAuth2 URL Generator scopes: bot + applications.commands
 */
function getBotInviteUrl(clientId = config.discord.clientId) {
  if (!clientId) return null;
  const params = new URLSearchParams({
    client_id: clientId,
    permissions: BOT_PERMISSIONS.toString(),
    scope: 'bot applications.commands',
  });
  return `https://discord.com/api/oauth2/authorize?${params}`;
}

/**
 * Dashboard login — OAuth2 URL Generator scopes: identify + guilds
 * Add redirect in portal: OAuth2 → Redirects
 */
function getDashboardOAuthUrl(clientId = config.discord.clientId) {
  if (!clientId) return null;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: config.oauth.redirectUri,
    response_type: 'code',
    scope: config.oauth.scopes.join(' '),
  });
  return `https://discord.com/api/oauth2/authorize?${params}`;
}

function printStartupLinks() {
  const clientId = config.discord.clientId;
  if (!clientId) {
    console.warn('[Minnie] DISCORD_CLIENT_ID missing — cannot generate invite link.');
    return;
  }

  const invite = getBotInviteUrl(clientId);
  const dashboard = getDashboardOAuthUrl(clientId);

  console.log('\n══════════════════════════════════════════════════════════');
  console.log('  MINNIE — Add bot to a server (copy this link):');
  console.log('══════════════════════════════════════════════════════════');
  console.log(`\n${invite}\n`);
  console.log('  OAuth2 URL Generator (bot invite):');
  console.log('    Scopes: bot, applications.commands');
  console.log('    Bot permissions: View Channels, Send Messages, Embed Links,');
  console.log('      Read Message History, Manage Roles');
  console.log('──────────────────────────────────────────────────────────');
  console.log('  Dashboard login (OAuth2 URL Generator):');
  console.log('    Scopes: identify, guilds');
  console.log(`    Redirect (dashboard): ${config.oauth.redirectUri}`);
  if (dashboard) console.log(`\n${dashboard}\n`);
  console.log('══════════════════════════════════════════════════════════\n');
}

module.exports = {
  getBotInviteUrl,
  getDashboardOAuthUrl,
  printStartupLinks,
  BOT_PERMISSIONS,
};
