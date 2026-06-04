const fs = require('fs');
const path = require('path');
const { getDatabase, getDbPath } = require('./connection');

function initializeDatabase() {
  const db = getDatabase();
  const schemaPath = path.join(__dirname, '../../schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
  console.log(`[DB] Initialized at ${getDbPath()}`);
  return db;
}

module.exports = { initializeDatabase };
