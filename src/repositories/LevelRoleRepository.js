const { getDatabase } = require('../database/connection');

class LevelRoleRepository {
  set(guildId, level, roleId, sortOrder = level) {
    getDatabase().prepare(`
      INSERT INTO level_roles (guild_id, level, role_id, sort_order)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(guild_id, level) DO UPDATE SET role_id = excluded.role_id, sort_order = excluded.sort_order
    `).run(guildId, level, roleId, sortOrder);
  }

  remove(guildId, level) {
    getDatabase().prepare('DELETE FROM level_roles WHERE guild_id=? AND level=?').run(guildId, level);
  }

  getAll(guildId) {
    return getDatabase().prepare('SELECT * FROM level_roles WHERE guild_id=? ORDER BY level ASC').all(guildId);
  }

  getEligible(guildId, level) {
    return getDatabase().prepare('SELECT * FROM level_roles WHERE guild_id=? AND level <= ? ORDER BY level ASC')
      .all(guildId, level);
  }
}

module.exports = new LevelRoleRepository();
