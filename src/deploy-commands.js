const { REST, Routes } = require('discord.js');
const config = require('./config');
const { loadCommands } = require('./commands');

async function deploy() {
  const { commands } = loadCommands();
  const rest = new REST({ version: '10' }).setToken(config.discord.token);

  console.log(`Deploying ${commands.length} slash commands...`);

  await rest.put(Routes.applicationCommands(config.discord.clientId), { body: commands });
  console.log('Successfully deployed global commands.');
}

deploy().catch(console.error);
