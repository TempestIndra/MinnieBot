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

async function deploy() {
  if (!config.discord.token || !config.discord.clientId) {
    throw new Error('DISCORD_TOKEN and DISCORD_CLIENT_ID are required in .env');
  }

  const { commands, names, mode } = getCommandsToDeploy();
  const rest = new REST({ version: '10' }).setToken(config.discord.token);

  console.log(`Deploying ${commands.length} slash commands (${mode})...`);
  console.log(names.join(', '));

  await rest.put(Routes.applicationCommands(config.discord.clientId), { body: commands });
  console.log('Successfully deployed global commands.');
  console.log('Note: Removed commands may still appear in Discord for up to ~1 hour (global command cache).');
}

deploy().catch((err) => {
  console.error('[deploy] Failed:', err);
  process.exit(1);
});
