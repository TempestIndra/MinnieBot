/**
 * Process supervisor — auto-restarts worker on crash, logs all output.
 */
require('dotenv').config();

const { spawn } = require('child_process');
const path = require('path');
const logger = require('./utils/logger');

const WORKER_SCRIPT = path.join(__dirname, 'worker.js');
const RESTART_DELAY_MS = parseInt(process.env.RESTART_DELAY_MS || '5000', 10);
const MAX_RESTARTS_PER_WINDOW = parseInt(process.env.MAX_RESTARTS || '15', 10);
const RESTART_WINDOW_MS = parseInt(process.env.RESTART_WINDOW_MS || '600000', 10);

let child = null;
let stopping = false;
const restartTimes = [];

function canRestart() {
  const now = Date.now();
  while (restartTimes.length && restartTimes[0] < now - RESTART_WINDOW_MS) {
    restartTimes.shift();
  }
  if (restartTimes.length >= MAX_RESTARTS_PER_WINDOW) {
    logger.error(
      `Max restarts (${MAX_RESTARTS_PER_WINDOW}) in ${RESTART_WINDOW_MS / 1000}s — supervisor stopping`
    );
    return false;
  }
  restartTimes.push(now);
  return true;
}

function spawnWorker() {
  if (stopping) return;

  logger.info(`Spawning worker (pid will be assigned)...`);

  child = spawn(process.execPath, [WORKER_SCRIPT], {
    env: { ...process.env, MINNIE_SUPERVISED: '1' },
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  logger.info(`Worker started pid=${child.pid}`);

  child.stdout.on('data', (chunk) => logger.raw(chunk, 'stdout'));
  child.stderr.on('data', (chunk) => logger.raw(chunk, 'stderr'));

  child.on('error', (err) => {
    logger.exception('supervisor:spawn', err);
  });

  child.on('exit', (code, signal) => {
    const msg = `Worker exited — code=${code ?? 'null'} signal=${signal ?? 'null'}`;
    if (code === 0 && !signal) {
      logger.info(msg);
      if (!stopping) process.exit(0);
      return;
    }

    logger.error(msg);
    writeCrashReport(code, signal);

    if (stopping) {
      process.exit(code || 1);
      return;
    }

    if (!canRestart()) {
      process.exit(1);
      return;
    }

    logger.warn(`Restarting worker in ${RESTART_DELAY_MS}ms...`);
    setTimeout(spawnWorker, RESTART_DELAY_MS);
  });
}

function writeCrashReport(code, signal) {
  const report = [
    '--- crash report ---',
    `time: ${new Date().toISOString()}`,
    `exitCode: ${code}`,
    `signal: ${signal}`,
    `restartCount: ${restartTimes.length}`,
    '--- end ---',
    '',
  ].join('\n');
  const fs = require('fs');
  fs.appendFileSync(require('./utils/logger').crashFile(), report, 'utf8');
}

function shutdown() {
  stopping = true;
  logger.info('Supervisor shutdown requested');
  if (child && !child.killed) {
    child.kill('SIGTERM');
    setTimeout(() => {
      if (child && !child.killed) child.kill('SIGKILL');
    }, 10000);
  } else {
    process.exit(0);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

logger.info('Supervisor started');
logger.info(`Logs directory: ${require('./utils/logger').LOG_DIR}`);
logger.info(`Auto-restart: max ${MAX_RESTARTS_PER_WINDOW} per ${RESTART_WINDOW_MS / 60000} min, delay ${RESTART_DELAY_MS}ms`);

spawnWorker();
