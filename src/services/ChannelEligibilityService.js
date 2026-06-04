const ChannelRulesRepository = require('../repositories/ChannelRulesRepository');

class ChannelEligibilityService {
  /**
   * Blacklist overrides whitelist. Channel rules override category rules.
   */
  canEarnXp(guild, channelId, type) {
    if (!guild || !channelId) return { allowed: false, reason: 'invalid_channel' };

    const channel = guild.channels.cache.get(channelId);
    if (!channel) return { allowed: false, reason: 'channel_not_found' };

    const categoryId = channel.parentId;
    const rules = ChannelRulesRepository.getChannelRules(guild.id);
    const catRules = ChannelRulesRepository.getCategoryRules(guild.id);

    const channelBlacklist = rules.find((r) => r.channel_id === channelId && r.rule_type === 'blacklist');
    if (channelBlacklist) {
      if (channelBlacklist.applies_to === 'both' || channelBlacklist.applies_to === type) {
        return { allowed: false, reason: 'channel_blacklisted' };
      }
    }

    const channelWhitelist = rules.find((r) => r.channel_id === channelId && r.rule_type === 'whitelist');
    if (channelWhitelist) {
      if (channelWhitelist.applies_to === 'both' || channelWhitelist.applies_to === type) {
        return { allowed: true, multiplier: this._bonus(guild.id, channelId, type) };
      }
      return { allowed: false, reason: 'channel_not_whitelisted_for_type' };
    }

    if (categoryId) {
      const catBlack = catRules.find(
        (r) => r.category_id === categoryId && r.rule_type === 'blacklist' && (r.applies_to === type)
      );
      if (catBlack) return { allowed: false, reason: 'category_blacklisted' };

      const catWhite = catRules.find(
        (r) => r.category_id === categoryId && r.rule_type === 'whitelist' && (r.applies_to === type)
      );
      const hasWhitelist = catRules.some((r) => r.rule_type === 'whitelist' && r.applies_to === type);
      if (hasWhitelist && !catWhite) {
        return { allowed: false, reason: 'category_not_whitelisted' };
      }
    }

    return { allowed: true, multiplier: this._bonus(guild.id, channelId, type) };
  }

  _bonus(guildId, channelId, type) {
    return ChannelRulesRepository.getBonusMultiplier(guildId, channelId, type);
  }
}

module.exports = new ChannelEligibilityService();
