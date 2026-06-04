const fs = require('fs');
const path = require('path');

function loadCommands() {
  const dir = __dirname;
  const commands = [];
  const map = new Map();

  for (const file of fs.readdirSync(dir)) {
    if (file === 'index.js' || !file.endsWith('.js')) continue;
    const mod = require(path.join(dir, file));
    const items = Array.isArray(mod) ? mod : [mod];
    for (const cmd of items) {
      if (cmd?.data && cmd?.execute) {
        commands.push(cmd.data.toJSON());
        map.set(cmd.data.name, cmd);
      }
    }
  }
  return { commands, map };
}

module.exports = { loadCommands };
