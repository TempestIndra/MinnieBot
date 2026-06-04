const UserRepository = require('../repositories/UserRepository');
const ShopRepository = require('../repositories/ShopRepository');
const LogRepository = require('../repositories/LogRepository');

class EconomyService {
  getBalance(userId, guildId) {
    return UserRepository.getOrCreate(userId, guildId).coins;
  }

  addCoins(userId, guildId, amount, source = 'admin', details = null) {
    const user = UserRepository.getOrCreate(userId, guildId);
    UserRepository.update(userId, guildId, { coins: user.coins + amount });
    LogRepository.logCoins(userId, guildId, amount, source, details);
    return UserRepository.getOrCreate(userId, guildId);
  }

  removeCoins(userId, guildId, amount, adminId) {
    const user = UserRepository.getOrCreate(userId, guildId);
    const newCoins = Math.max(0, user.coins - amount);
    UserRepository.update(userId, guildId, { coins: newCoins });
    LogRepository.logCoins(userId, guildId, -amount, 'admin', `By ${adminId}`);
    LogRepository.logAdmin(guildId, adminId, 'remove_coins', userId, String(amount));
    return UserRepository.getOrCreate(userId, guildId);
  }

  transfer(fromId, toId, guildId, amount) {
    const from = UserRepository.getOrCreate(fromId, guildId);
    if (from.coins < amount) return { ok: false, reason: 'insufficient' };
    this.removeCoins(fromId, guildId, amount, fromId);
    this.addCoins(toId, guildId, amount, 'transfer', `From ${fromId}`);
    return { ok: true };
  }

  async buyRole(guild, member, roleId) {
    const item = ShopRepository.get(guild.id, roleId);
    if (!item) return { ok: false, reason: 'not_in_shop' };
    if (ShopRepository.hasPurchased(member.id, guild.id, roleId)) {
      return { ok: false, reason: 'already_owned' };
    }

    const user = UserRepository.getOrCreate(member.id, guild.id);
    if (user.coins < item.cost) return { ok: false, reason: 'insufficient_coins' };

    const role = guild.roles.cache.get(roleId);
    if (!role) return { ok: false, reason: 'role_missing' };

    UserRepository.update(member.id, guild.id, { coins: user.coins - item.cost });
    ShopRepository.recordPurchase(member.id, guild.id, roleId, item.cost);
    LogRepository.logCoins(member.id, guild.id, -item.cost, 'shop', roleId);
    await member.roles.add(role).catch(() => {});

    return { ok: true, cost: item.cost };
  }
}

module.exports = new EconomyService();
