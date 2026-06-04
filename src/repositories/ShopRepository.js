const { getDatabase } = require('../database/connection');

class ShopRepository {
  create(guildId, roleId, cost, name, description) {
    getDatabase().prepare(`
      INSERT INTO shop_roles (guild_id, role_id, cost, name, description) VALUES (?,?,?,?,?)
      ON CONFLICT(guild_id, role_id) DO UPDATE SET cost=excluded.cost, name=excluded.name, description=excluded.description
    `).run(guildId, roleId, cost, name, description);
  }

  remove(guildId, roleId) {
    getDatabase().prepare('DELETE FROM shop_roles WHERE guild_id=? AND role_id=?').run(guildId, roleId);
  }

  getAll(guildId) {
    return getDatabase().prepare('SELECT * FROM shop_roles WHERE guild_id=? ORDER BY cost ASC').all(guildId);
  }

  get(guildId, roleId) {
    return getDatabase().prepare('SELECT * FROM shop_roles WHERE guild_id=? AND role_id=?').get(guildId, roleId);
  }

  recordPurchase(userId, guildId, roleId, cost) {
    getDatabase().prepare('INSERT INTO shop_purchases (user_id, guild_id, role_id, cost) VALUES (?,?,?,?)')
      .run(userId, guildId, roleId, cost);
  }

  hasPurchased(userId, guildId, roleId) {
    const row = getDatabase().prepare('SELECT id FROM shop_purchases WHERE user_id=? AND guild_id=? AND role_id=?')
      .get(userId, guildId, roleId);
    return !!row;
  }

  getPurchases(guildId, limit = 50) {
    return getDatabase().prepare('SELECT * FROM shop_purchases WHERE guild_id=? ORDER BY id DESC LIMIT ?').all(guildId, limit);
  }
}

module.exports = new ShopRepository();
