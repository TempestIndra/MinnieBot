/**
 * Minnie XP Bot - Main entry
 * Starts Discord bot and REST API (dashboard backend)
 */
require('dotenv').config();
const { startBot } = require('./bot');
const { startApi } = require('./api-server');

async function main() {
  console.log('[Minnie] Starting bot and API...');
  startApi();
  await startBot();
}

main().catch((err) => {
  console.error('[Minnie] Fatal error:', err);
  process.exit(1);
});
