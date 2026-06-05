const GuildSettingsRepository = require('../../repositories/GuildSettingsRepository');
const UserRepository = require('../../repositories/UserRepository');
const LeaderboardService = require('../../services/LeaderboardService');
const GuildConfigService = require('../../services/GuildConfigService');
const LogRepository = require('../../repositories/LogRepository');
const ShopRepository = require('../../repositories/ShopRepository');
const QuestService = require('../../services/QuestService');
const XpService = require('../../services/XpService');
const EconomyService = require('../../services/EconomyService');
const ResetService = require('../../services/ResetService');
const { xpProgressInLevel } = require('../../utils/level');
const botRegistry = require('../../discord/botRegistry');

class GuildController {
  overview(req, res) {
    const guildId = req.guildId;
    const stats = UserRepository.getGuildStats(guildId);
    const settings = GuildSettingsRepository.get(guildId);
    const top = LeaderboardService.get(guildId, 'alltime', 'total', 5);
    res.json({ stats, settings, topUsers: top });
  }

  getSettings(req, res) {
    res.json(GuildConfigService.getSettings(req.guildId));
  }

  updateSettings(req, res) {
    const updated = GuildConfigService.updateSettings(req.guildId, req.body, req.user.id);
    res.json(updated);
  }

  getChannelRules(req, res) {
    res.json(GuildConfigService.getChannelRules(req.guildId));
  }

  whitelistChannel(req, res) {
    GuildConfigService.whitelistChannel(req.guildId, req.body.channelId, req.body.appliesTo || 'both', req.user.id);
    res.json({ ok: true });
  }

  blacklistChannel(req, res) {
    GuildConfigService.blacklistChannel(req.guildId, req.body.channelId, req.body.appliesTo || 'both', req.user.id);
    res.json({ ok: true });
  }

  unwhitelistChannel(req, res) {
    GuildConfigService.unwhitelistChannel(req.guildId, req.body.channelId, req.user.id);
    res.json({ ok: true });
  }

  unblacklistChannel(req, res) {
    GuildConfigService.unblacklistChannel(req.guildId, req.body.channelId, req.user.id);
    res.json({ ok: true });
  }

  whitelistCategory(req, res) {
    GuildConfigService.whitelistCategory(req.guildId, req.body.categoryId, req.body.appliesTo, req.user.id);
    res.json({ ok: true });
  }

  blacklistCategory(req, res) {
    GuildConfigService.blacklistCategory(req.guildId, req.body.categoryId, req.body.appliesTo, req.user.id);
    res.json({ ok: true });
  }

  unwhitelistCategory(req, res) {
    GuildConfigService.unwhitelistCategory(req.guildId, req.body.categoryId, req.body.appliesTo, req.user.id);
    res.json({ ok: true });
  }

  unblacklistCategory(req, res) {
    GuildConfigService.unblacklistCategory(req.guildId, req.body.categoryId, req.body.appliesTo, req.user.id);
    res.json({ ok: true });
  }

  setChannelBonus(req, res) {
    GuildConfigService.setChannelBonus(req.guildId, req.body.channelId, req.body.multiplier, req.user.id);
    res.json({ ok: true });
  }

  removeChannelBonus(req, res) {
    GuildConfigService.removeChannelBonus(req.guildId, req.body.channelId, req.user.id);
    res.json({ ok: true });
  }

  getLevelRoles(req, res) {
    res.json(GuildConfigService.getLevelRoles(req.guildId));
  }

  setLevelRole(req, res) {
    GuildConfigService.setLevelRole(req.guildId, req.body.level, req.body.roleId, req.user.id);
    res.json({ ok: true });
  }

  removeLevelRole(req, res) {
    GuildConfigService.removeLevelRole(req.guildId, req.body.level, req.user.id);
    res.json({ ok: true });
  }

  getShop(req, res) {
    res.json(GuildConfigService.getShop(req.guildId));
  }

  createShopRole(req, res) {
    GuildConfigService.createShopRole(req.guildId, req.body.roleId, req.body.cost, req.body.name, req.body.description, req.user.id);
    res.json({ ok: true });
  }

  removeShopRole(req, res) {
    GuildConfigService.removeShopRole(req.guildId, req.body.roleId, req.user.id);
    res.json({ ok: true });
  }

  getLeaderboard(req, res) {
    const { type = 'alltime', source = 'total', limit = 25 } = req.query;
    res.json(LeaderboardService.get(req.guildId, type, source, parseInt(limit, 10)));
  }

  listUsers(req, res) {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const offset = parseInt(req.query.offset, 10) || 0;
    const users = UserRepository.listAll(req.guildId, limit, offset);
    res.json({ users, total: UserRepository.getGuildStats(req.guildId).user_count });
  }

  searchUsers(req, res) {
    const q = req.query.q || '';
    res.json({ users: UserRepository.search(req.guildId, q, 50) });
  }

  async resolveUser(req, res) {
    const userId = (req.body.userId || req.query.userId || '').trim();
    if (!/^\d{17,20}$/.test(userId)) {
      return res.status(400).json({ error: 'Invalid Discord user ID' });
    }

    let user = UserRepository.findById(req.guildId, userId);
    if (user) {
      return res.json(this._userPayload(req.guildId, user));
    }

    const client = botRegistry.getClient();
    const guild = client?.guilds?.cache?.get(req.guildId);
    if (!guild) {
      return res.status(404).json({ error: 'User not in database. Bot must be online to import from Discord.' });
    }

    try {
      const member = await guild.members.fetch(userId);
      user = UserRepository.getOrCreate(userId, req.guildId, member.user.username);
      return res.json(this._userPayload(req.guildId, user));
    } catch {
      return res.status(404).json({ error: 'Member not found in this server' });
    }
  }

  _userPayload(guildId, user) {
    const rank = UserRepository.getRank(user.user_id, guildId);
    const progress = xpProgressInLevel(user.total_xp, user.level);
    return {
      user,
      rank,
      progress,
      xpToNext: progress.needed - progress.current,
    };
  }

  getUser(req, res) {
    const existing = UserRepository.findById(req.guildId, req.params.userId);
    const user = existing || UserRepository.getOrCreate(req.params.userId, req.guildId);
    res.json(this._userPayload(req.guildId, user));
  }

  adjustXp(req, res) {
    const user = XpService.adminAdjust(req.body.userId, req.guildId, req.body.amount, req.user.id);
    res.json(user);
  }

  resetXp(req, res) {
    const user = XpService.resetXp(req.body.userId, req.guildId, req.user.id);
    res.json(user);
  }

  adjustCoins(req, res) {
    const user = req.body.amount >= 0
      ? EconomyService.addCoins(req.body.userId, req.guildId, req.body.amount, 'admin')
      : EconomyService.removeCoins(req.body.userId, req.guildId, Math.abs(req.body.amount), req.user.id);
    res.json(user);
  }

  resetUser(req, res) {
    res.json(UserRepository.resetUser(req.body.userId, req.guildId));
  }

  getLogs(req, res) {
    const type = req.query.type || 'xp';
    const guildId = req.guildId;
    let data;
    switch (type) {
      case 'coins': data = LogRepository.getCoinLogs(guildId); break;
      case 'admin': data = LogRepository.getAdminLogs(guildId); break;
      case 'suspicious': data = LogRepository.getSuspicious(guildId); break;
      default: data = LogRepository.getXpLogs(guildId);
    }
    res.json(data);
  }

  getQuests(req, res) {
    res.json(QuestService.getQuestsForUser(req.query.userId || req.user.id, req.guildId));
  }

  getShopPurchases(req, res) {
    res.json(ShopRepository.getPurchases(req.guildId));
  }

  forceWeeklyReset(req, res) {
    ResetService.weeklyReset(req.guildId, req.user.id);
    res.json({ ok: true });
  }

  forceSeasonReset(req, res) {
    ResetService.seasonReset(req.guildId, req.user.id);
    res.json({ ok: true });
  }

  analytics(req, res) {
    const logs = LogRepository.getXpLogs(req.guildId, 200);
    const byDay = {};
    for (const log of logs) {
      const day = log.created_at?.slice(0, 10) || 'unknown';
      byDay[day] = (byDay[day] || 0) + log.amount;
    }
    res.json({
      xpByDay: Object.entries(byDay).map(([date, xp]) => ({ date, xp })),
      stats: UserRepository.getGuildStats(req.guildId),
    });
  }
}

module.exports = new GuildController();
