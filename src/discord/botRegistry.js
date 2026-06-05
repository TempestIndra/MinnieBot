/** Shared Discord bot client reference (bot + API in same process) */

let client = null;
const guildIds = new Set();

function setClient(discordClient) {
  client = discordClient;

  discordClient.on('guildCreate', (guild) => {
    guildIds.add(guild.id);
  });

  discordClient.on('guildDelete', (guild) => {
    guildIds.delete(guild.id);
  });
}

function syncGuildsFromCache() {
  guildIds.clear();
  if (!client?.isReady()) return;
  for (const id of client.guilds.cache.keys()) {
    guildIds.add(id);
  }
}

function getClient() {
  return client;
}

function getGuildIds() {
  if (client?.isReady() && guildIds.size === 0) {
    syncGuildsFromCache();
  }
  return new Set(guildIds);
}

function isBotInGuild(guildId) {
  return getGuildIds().has(guildId);
}

module.exports = {
  setClient,
  syncGuildsFromCache,
  getClient,
  getGuildIds,
  isBotInGuild,
};
