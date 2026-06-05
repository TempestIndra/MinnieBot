const fs = require('fs');
const path = require('path');

const LOG_DIR = process.env.LOG_DIR || path.join(process.cwd(), 'logs');
const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const MIN_LEVEL = LEVELS[process.env.LOG_LEVEL?.toLowerCase()] ?? LEVELS.info;

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function todayFile() {
  return path.join(LOG_DIR, `minnie-${new Date().toISOString().slice(0, 10)}.log`);
}

function crashFile() {
  return path.join(LOG_DIR, 'crashes.log');
}

function formatLine(level, tag, message, meta) {
  const ts = new Date().toISOString();
  const extra = meta !== undefined ? ` ${typeof meta === 'string' ? meta : JSON.stringify(meta)}` : '';
  return `[${ts}] [${level.toUpperCase()}]${tag ? ` [${tag}]` : ''} ${message}${extra}`;
}

function write(file, line) {
  try {
    fs.appendFileSync(file, `${line}\n`, 'utf8');
  } catch (err) {
    process.stderr.write(`Logger write failed: ${err.message}\n`);
  }
}

function log(level, tag, message, meta) {
  if (LEVELS[level] < MIN_LEVEL) return;
  const line = formatLine(level, tag, message, meta);
  const out = level === 'error' || level === 'warn' ? process.stderr : process.stdout;
  out.write(`${line}\n`);
  write(todayFile(), line);
  if (level === 'error') write(crashFile(), line);
}

class Logger {
  constructor(tag = 'app') {
    this.tag = tag;
  }

  child(tag) {
    return new Logger(this.tag ? `${this.tag}:${tag}` : tag);
  }

  debug(msg, meta) { log('debug', this.tag, msg, meta); }
  info(msg, meta) { log('info', this.tag, msg, meta); }
  warn(msg, meta) { log('warn', this.tag, msg, meta); }
  error(msg, meta) { log('error', this.tag, msg, meta); }

  /** Raw stdout/stderr from child process (no double timestamp if already formatted) */
  raw(chunk, stream = 'stdout') {
    const text = chunk.toString().replace(/\r?\n$/, '');
    if (!text) return;
    for (const line of text.split(/\r?\n/)) {
      if (!line.trim()) continue;
      write(todayFile(), stream === 'stderr' ? `[stderr] ${line}` : line);
      if (stream === 'stderr') process.stderr.write(`${line}\n`);
      else process.stdout.write(`${line}\n`);
    }
  }

  exception(tag, err) {
    const payload = {
      message: err?.message || String(err),
      stack: err?.stack,
      name: err?.name,
      code: err?.code,
    };
    this.error(`${tag}: ${payload.message}`, payload.stack);
    write(crashFile(), formatLine('error', tag, payload.message, payload.stack));
  }
}

const root = new Logger('minnie');

module.exports = root;
module.exports.Logger = Logger;
module.exports.LOG_DIR = LOG_DIR;
module.exports.crashFile = crashFile;
module.exports.todayFile = todayFile;
