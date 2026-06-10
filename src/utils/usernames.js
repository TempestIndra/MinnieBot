const UserRepository = require('../repositories/UserRepository');

function displayName(member) {
  return member.displayName || member.user.globalName || member.user.username;
}

function isResolvableUsername(name) {
  return Boolean(name && name !== 'Unknown');
}

/**
 * Resolve display names from Discord and backfill the database.
 */
async function enrichLeaderboardRows(guild, rows) {
  if (!rows.length || !guild) return rows;

  const needsFetch = [];

  for (const row of rows) {
    const cached = guild.members.cache.get(row.user_id);
    if (cached) {
      const name = displayName(cached);
      if (isResolvableUsername(name) && name !== row.username) {
        row.username = name;
        UserRepository.update(row.user_id, row.guild_id, { username: name });
      }
      continue;
    }
    if (!isResolvableUsername(row.username)) {
      needsFetch.push(row.user_id);
    }
  }

  if (needsFetch.length) {
    try {
      await guild.members.fetch({ user: needsFetch });
    } catch {
      // Partial fetch is fine — resolve what we can below.
    }

    for (const row of rows) {
      if (isResolvableUsername(row.username)) continue;
      const member = guild.members.cache.get(row.user_id);
      if (member) {
        const name = displayName(member);
        row.username = name;
        UserRepository.update(row.user_id, row.guild_id, { username: name });
      }
    }
  }

  const stillUnknown = rows.filter((r) => !isResolvableUsername(r.username));
  if (stillUnknown.length && guild.client) {
    await Promise.all(stillUnknown.map(async (row) => {
      try {
        const user = await guild.client.users.fetch(row.user_id);
        const name = user.globalName || user.username;
        if (isResolvableUsername(name)) {
          row.username = name;
          UserRepository.update(row.user_id, row.guild_id, { username: name });
        }
      } catch {
        // Member left the server — keep stored name or Unknown.
      }
    }));
  }

  return rows;
}

module.exports = {
  displayName,
  isResolvableUsername,
  enrichLeaderboardRows,
};
