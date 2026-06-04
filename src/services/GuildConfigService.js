const GuildSettingsRepository = require('../repositories/GuildSettingsRepository');
const ChannelRulesRepository = require('../repositories/ChannelRulesRepository');
const LevelRoleRepository = require('../repositories/LevelRoleRepository');
const ShopRepository = require('../repositories/ShopRepository');
const LogRepository = require('../repositories/LogRepository');

/**
 * Unified config service used by slash commands and REST API.
 */
class GuildConfigService {
  getSettings(guildId) {
    return GuildSettingsRepository.get(guildId);
  }

  updateSettings(guildId, fields, adminId) {
    const result = GuildSettingsRepository.update(guildId, fields);
    if (adminId) LogRepository.logAdmin(guildId, adminId, 'update_settings', null, JSON.stringify(fields));
    return result;
  }

  setVoiceXpRate(guildId, amount, adminId) {
    return this.updateSettings(guildId, { voice_xp_rate: amount }, adminId);
  }

  setTextXpRate(guildId, min, max, adminId) {
    return this.updateSettings(guildId, { text_xp_min: min, text_xp_max: max }, adminId);
  }

  setTextCooldown(guildId, seconds, adminId) {
    return this.updateSettings(guildId, { text_cooldown: seconds }, adminId);
  }

  setDailyCap(guildId, amount, adminId) {
    return this.updateSettings(guildId, { daily_xp_cap: amount }, adminId);
  }

  setLogChannel(guildId, channelId, adminId) {
    return this.updateSettings(guildId, { log_channel_id: channelId }, adminId);
  }

  whitelistChannel(guildId, channelId, appliesTo, adminId) {
    ChannelRulesRepository.setChannelRule(guildId, channelId, 'whitelist', appliesTo);
    LogRepository.logAdmin(guildId, adminId, 'whitelist_channel', channelId, appliesTo);
  }

  blacklistChannel(guildId, channelId, appliesTo, adminId) {
    ChannelRulesRepository.setChannelRule(guildId, channelId, 'blacklist', appliesTo);
    LogRepository.logAdmin(guildId, adminId, 'blacklist_channel', channelId, appliesTo);
  }

  unwhitelistChannel(guildId, channelId, adminId) {
    ChannelRulesRepository.removeChannelRule(guildId, channelId, 'whitelist');
    LogRepository.logAdmin(guildId, adminId, 'unwhitelist_channel', channelId, null);
  }

  unblacklistChannel(guildId, channelId, adminId) {
    ChannelRulesRepository.removeChannelRule(guildId, channelId, 'blacklist');
    LogRepository.logAdmin(guildId, adminId, 'unblacklist_channel', channelId, null);
  }

  whitelistCategory(guildId, categoryId, appliesTo, adminId) {
    ChannelRulesRepository.setCategoryRule(guildId, categoryId, 'whitelist', appliesTo);
    LogRepository.logAdmin(guildId, adminId, 'whitelist_category', categoryId, appliesTo);
  }

  blacklistCategory(guildId, categoryId, appliesTo, adminId) {
    ChannelRulesRepository.setCategoryRule(guildId, categoryId, 'blacklist', appliesTo);
    LogRepository.logAdmin(guildId, adminId, 'blacklist_category', categoryId, appliesTo);
  }

  unwhitelistCategory(guildId, categoryId, appliesTo, adminId) {
    ChannelRulesRepository.removeCategoryRule(guildId, categoryId, 'whitelist', appliesTo);
    LogRepository.logAdmin(guildId, adminId, 'unwhitelist_category', categoryId, appliesTo);
  }

  unblacklistCategory(guildId, categoryId, appliesTo, adminId) {
    ChannelRulesRepository.removeCategoryRule(guildId, categoryId, 'blacklist', appliesTo);
    LogRepository.logAdmin(guildId, adminId, 'unblacklist_category', categoryId, appliesTo);
  }

  setChannelBonus(guildId, channelId, multiplier, adminId) {
    ChannelRulesRepository.setBonus(guildId, channelId, multiplier);
    LogRepository.logAdmin(guildId, adminId, 'set_channel_bonus', channelId, String(multiplier));
  }

  removeChannelBonus(guildId, channelId, adminId) {
    ChannelRulesRepository.removeBonus(guildId, channelId);
    LogRepository.logAdmin(guildId, adminId, 'remove_channel_bonus', channelId, null);
  }

  setLevelRole(guildId, level, roleId, adminId) {
    LevelRoleRepository.set(guildId, level, roleId);
    LogRepository.logAdmin(guildId, adminId, 'set_level_role', roleId, String(level));
  }

  removeLevelRole(guildId, level, adminId) {
    LevelRoleRepository.remove(guildId, level);
    LogRepository.logAdmin(guildId, adminId, 'remove_level_role', null, String(level));
  }

  getLevelRoles(guildId) {
    return LevelRoleRepository.getAll(guildId);
  }

  getChannelRules(guildId) {
    return {
      channels: ChannelRulesRepository.getChannelRules(guildId),
      categories: ChannelRulesRepository.getCategoryRules(guildId),
      bonuses: ChannelRulesRepository.getBonusChannels(guildId),
    };
  }

  getShop(guildId) {
    return ShopRepository.getAll(guildId);
  }

  createShopRole(guildId, roleId, cost, name, description, adminId) {
    ShopRepository.create(guildId, roleId, cost, name, description);
    LogRepository.logAdmin(guildId, adminId, 'create_shop_role', roleId, String(cost));
  }

  removeShopRole(guildId, roleId, adminId) {
    ShopRepository.remove(guildId, roleId);
    LogRepository.logAdmin(guildId, adminId, 'remove_shop_role', roleId, null);
  }
}

module.exports = new GuildConfigService();
