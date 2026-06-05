/**
 * Global crash detection — logs then exits so supervisor can restart.
 */
function registerCrashHandlers(logger) {
  process.on('uncaughtException', (err) => {
    logger.exception('uncaughtException', err);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    const err = reason instanceof Error ? reason : new Error(String(reason));
    logger.exception('unhandledRejection', err);
    process.exit(1);
  });

  process.on('warning', (warning) => {
    logger.warn(`${warning.name}: ${warning.message}`);
  });
}

module.exports = { registerCrashHandlers };
