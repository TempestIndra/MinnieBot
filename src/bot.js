const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { initializeDatabase } = require('./database/init');
const { loadCommands } = require('./commands');

function createBot() {
  initializeDatabase();

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
    ],
    partials: [Partials.Channel, Partials.Message],
  });

  const { map: commandMap } = loadCommands();
  client.commandMap = commandMap;

  const eventsPath = path.join(__dirname, 'events');
  for (const file of fs.readdirSync(eventsPath).filter((f) => f.endsWith('.js'))) {
    const event = require(path.join(eventsPath, file));
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, { client, commandMap }));
    } else {
      client.on(event.name, (...args) => event.execute(...args, { client, commandMap }));
    }
  }

  return client;
}

async function startBot() {
  if (!config.discord.token) {
    throw new Error('DISCORD_TOKEN is required in .env');
  }
  const client = createBot();
  await client.login(config.discord.token);
  return client;
}

module.exports = { createBot, startBot };

if (require.main === module) {
  startBot().catch((err) => {
    console.error('[Bot] Failed to start:', err);
    process.exit(1);
  });
}
