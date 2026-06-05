/**
 * Minnie worker — Discord bot + API (spawned by supervisor).
 */
require('dotenv').config();

const logger = require('./utils/logger');
const { registerCrashHandlers } = require('./utils/crashHandlers');
const { startBot } = require('./bot');
const { startApi } = require('./api-server');
const { printStartupLinks } = require('./utils/invite');

registerCrashHandlers(logger.child('process'));

let discordClient = null;
let httpServer = null;

async function shutdown(signal) {
  logger.info(`Shutting down (${signal})...`);
  try {
    if (discordClient) {
      discordClient.destroy();
      logger.info('Discord client destroyed');
    }
    if (httpServer) {
      await new Promise((resolve) => httpServer.close(resolve));
      logger.info('API server closed');
    }
  } catch (err) {
    logger.exception('shutdown', err);
  }
  process.exit(0);
}

async function main() {
  logger.info('Worker starting (bot + API)...');
  printStartupLinks();

  httpServer = startApi();
  discordClient = await startBot();

  discordClient.on('error', (err) => logger.exception('discord', err));
  discordClient.on('shardError', (err) => logger.exception('discord:shard', err));

  logger.info(`Worker ready — Discord: ${discordClient.user?.tag || 'unknown'}`);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

main().catch((err) => {
  logger.exception('fatal', err);
  process.exit(1);
});
