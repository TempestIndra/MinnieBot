const config = require('../config');

function formatLevelLabel(level, prestige = 0) {
  if (config.prestige.enabled && prestige > 0) {
    return `Lv.${level} P${prestige}`;
  }
  return `Lv.${level}`;
}

function formatProfileLevel(level, prestige = 0) {
  if (config.prestige.enabled && prestige > 0) {
    return `Level **${level}** | Prestige **${prestige}**`;
  }
  return `Level **${level}**`;
}

module.exports = { formatLevelLabel, formatProfileLevel };
