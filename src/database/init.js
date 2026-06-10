const fs = require('fs');
const path = require('path');
const { getDatabase, getDbPath } = require('./connection');
const logger = require('../utils/logger').child('db');

const MIGRATIONS = [
  'ALTER TABLE guild_settings ADD COLUMN dashboard_url TEXT',
  'ALTER TABLE guild_settings ADD COLUMN dashboard_link_text TEXT',
  'ALTER TABLE guild_settings ADD COLUMN dashboard_embed_title TEXT',
  'ALTER TABLE guild_settings ADD COLUMN dashboard_embed_description TEXT',
  'ALTER TABLE guild_settings ADD COLUMN leaderboard_restricted INTEGER NOT NULL DEFAULT 0',
  'ALTER TABLE guild_settings ADD COLUMN leaderboard_min_role_id TEXT',
  'ALTER TABLE guild_settings ADD COLUMN leaderboard_allowed_role_ids TEXT',
  'ALTER TABLE guild_settings ADD COLUMN dashboard_min_role_id TEXT',
  'ALTER TABLE guild_settings ADD COLUMN dashboard_allowed_role_ids TEXT',
];

function runMigrations(db) {
  for (const sql of MIGRATIONS) {
    try {
      db.exec(sql);
    } catch (err) {
      if (!err.message.includes('duplicate column')) throw err;
    }
  }
}

function initializeDatabase() {
  const db = getDatabase();
  const schemaPath = path.join(__dirname, '../../schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
  runMigrations(db);
  logger.info(`Initialized at ${getDbPath()}`);
  return db;
}

module.exports = { initializeDatabase };
