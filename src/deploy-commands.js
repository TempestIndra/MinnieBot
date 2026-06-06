const { REST, Routes } = require('discord.js');
const config = require('./config');
const { loadCommands } = require('./commands');
const essentialCommands = require('./config/essential-commands');

function getCommandsToDeploy() {
  const { commands, map } = loadCommands();

  if (process.env.DEPLOY_ALL_COMMANDS === 'true') {
    return { commands, names: commands.map((c) => c.name), mode: 'all' };
  }

  const allowlist = process.env.DEPLOY_COMMANDS
    ? process.env.DEPLOY_COMMANDS.split(',').map((s) => s.trim()).filter(Boolean)
    : essentialCommands;

  const filtered = [];
  const missing = [];

  for (const name of allowlist) {
    const cmd = map.get(name);
    if (cmd) {
      filtered.push(cmd.data.toJSON());
    } else {
      missing.push(name);
    }
  }

  if (missing.length) {
    console.warn(`[deploy] Unknown command names (skipped): ${missing.join(', ')}`);
  }

  return { commands: filtered, names: filtered.map((c) => c.name), mode: 'essential' };
}

async function validateBotCredentials(rest, clientId) {
  try {
    const app = await rest.get(Routes.oauth2CurrentApplication());
    if (String(app.id) !== String(clientId)) {
      console.error('[deploy] DISCORD_CLIENT_ID does not match this bot token\'s application.');
      console.error(`  .env CLIENT_ID: ${clientId}`);
      console.error(`  Token app ID:   ${app.id}`);
      process.exit(1);
    }
    console.log(`[deploy] Bot application: ${app.name} (${app.id})`);
  } catch (err) {
    if (err.status === 401) {
      console.error('[deploy] 401 Unauthorized — Discord rejected DISCORD_TOKEN.');
      console.error('');
      console.error('Fix on the server (/opt/minnie/.env):');
      console.error('  1. Developer Portal → Your App → Bot → Reset Token → copy new token');
      console.error('  2. Set DISCORD_TOKEN=<bot token>  (NOT client secret, NOT OAuth token)');
      console.error('  3. Set DISCORD_CLIENT_ID=<Application ID from General Information>');
      console.error('  4. Both must be from the SAME application');
      console.error('  5. No quotes or spaces around values');
      console.error('');
      console.error('Test: grep DISCORD_TOKEN /opt/minnie/.env  (file must exist and be readable)');
      process.exit(1);
    }
    throw err;
  }
}

async function deploy() {
  const token = config.discord.token;
  const clientId = config.discord.clientId;

  if (!token || !clientId) {
    console.error('[deploy] Missing DISCORD_TOKEN or DISCORD_CLIENT_ID in /opt/minnie/.env');
    process.exit(1);
  }

  if (token === config.discord.clientSecret) {
    console.error('[deploy] DISCORD_TOKEN looks like DISCORD_CLIENT_SECRET — use the Bot token instead.');
    process.exit(1);
  }

  const { commands, names, mode } = getCommandsToDeploy();
  const rest = new REST({ version: '10' }).setToken(token);

  await validateBotCredentials(rest, clientId);

  console.log(`Deploying ${commands.length} slash commands (${mode})...`);
  console.log(names.join(', '));

  await rest.put(Routes.applicationCommands(clientId), { body: commands });
  console.log('Successfully deployed global commands.');
  console.log('Note: Removed commands may still appear in Discord for up to ~1 hour (global command cache).');
}

deploy().catch((err) => {
  if (err.status !== 401) console.error('[deploy] Failed:', err);
  process.exit(1);
});
