/**
 * Minnie entry point — starts supervisor (crash recovery + logging).
 * Direct worker (no auto-restart): npm run start:worker
 */
require('./supervisor');
