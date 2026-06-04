/**
 * XP Required for next level = 100 × Level^1.5
 */
function xpRequiredForLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.5));
}

function totalXpForLevel(level) {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += xpRequiredForLevel(i);
  }
  return total;
}

function levelFromTotalXp(totalXp) {
  let level = 1;
  let accumulated = 0;
  while (true) {
    const needed = xpRequiredForLevel(level);
    if (accumulated + needed > totalXp) break;
    accumulated += needed;
    level++;
  }
  return level;
}

function xpProgressInLevel(totalXp, level) {
  const base = totalXpForLevel(level);
  const current = totalXp - base;
  const needed = xpRequiredForLevel(level);
  return { current, needed, percent: needed > 0 ? Math.min(100, (current / needed) * 100) : 100 };
}

module.exports = {
  xpRequiredForLevel,
  totalXpForLevel,
  levelFromTotalXp,
  xpProgressInLevel,
};
