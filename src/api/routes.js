const express = require('express');
const AuthController = require('./controllers/AuthController');
const GuildController = require('./controllers/GuildController');
const { requireAuth, requireGuildAdmin } = require('./middleware/auth');

function createRouter() {
  const router = express.Router();

  router.get('/auth/login', AuthController.getLoginUrl.bind(AuthController));
  router.get('/auth/exchange', AuthController.exchange.bind(AuthController));
  router.get('/auth/callback', AuthController.callback.bind(AuthController));
  router.get('/auth/me', requireAuth, AuthController.me.bind(AuthController));
  router.post('/auth/logout', requireAuth, AuthController.logout.bind(AuthController));

  const guild = express.Router({ mergeParams: true });
  guild.use(requireAuth, requireGuildAdmin);

  guild.get('/overview', GuildController.overview.bind(GuildController));
  guild.get('/settings', GuildController.getSettings.bind(GuildController));
  guild.patch('/settings', GuildController.updateSettings.bind(GuildController));
  guild.get('/channels/rules', GuildController.getChannelRules.bind(GuildController));
  guild.post('/channels/whitelist', GuildController.whitelistChannel.bind(GuildController));
  guild.post('/channels/blacklist', GuildController.blacklistChannel.bind(GuildController));
  guild.delete('/channels/whitelist', GuildController.unwhitelistChannel.bind(GuildController));
  guild.delete('/channels/blacklist', GuildController.unblacklistChannel.bind(GuildController));
  guild.post('/categories/whitelist', GuildController.whitelistCategory.bind(GuildController));
  guild.post('/categories/blacklist', GuildController.blacklistCategory.bind(GuildController));
  guild.delete('/categories/whitelist', GuildController.unwhitelistCategory.bind(GuildController));
  guild.delete('/categories/blacklist', GuildController.unblacklistCategory.bind(GuildController));
  guild.post('/channels/bonus', GuildController.setChannelBonus.bind(GuildController));
  guild.delete('/channels/bonus', GuildController.removeChannelBonus.bind(GuildController));
  guild.get('/level-roles', GuildController.getLevelRoles.bind(GuildController));
  guild.post('/level-roles', GuildController.setLevelRole.bind(GuildController));
  guild.delete('/level-roles', GuildController.removeLevelRole.bind(GuildController));
  guild.get('/shop', GuildController.getShop.bind(GuildController));
  guild.post('/shop', GuildController.createShopRole.bind(GuildController));
  guild.delete('/shop', GuildController.removeShopRole.bind(GuildController));
  guild.get('/shop/purchases', GuildController.getShopPurchases.bind(GuildController));
  guild.get('/leaderboard', GuildController.getLeaderboard.bind(GuildController));
  guild.get('/users', GuildController.listUsers.bind(GuildController));
  guild.get('/users/search', GuildController.searchUsers.bind(GuildController));
  guild.post('/users/resolve', GuildController.resolveUser.bind(GuildController));
  guild.get('/users/:userId', GuildController.getUser.bind(GuildController));
  guild.post('/users/xp', GuildController.adjustXp.bind(GuildController));
  guild.post('/users/xp/reset', GuildController.resetXp.bind(GuildController));
  guild.post('/users/coins', GuildController.adjustCoins.bind(GuildController));
  guild.post('/users/reset', GuildController.resetUser.bind(GuildController));
  guild.get('/logs', GuildController.getLogs.bind(GuildController));
  guild.get('/quests', GuildController.getQuests.bind(GuildController));
  guild.get('/analytics', GuildController.analytics.bind(GuildController));
  guild.post('/resets/weekly', GuildController.forceWeeklyReset.bind(GuildController));
  guild.post('/resets/season', GuildController.forceSeasonReset.bind(GuildController));

  router.use('/guilds/:guildId', guild);

  return router;
}

module.exports = { createRouter };
