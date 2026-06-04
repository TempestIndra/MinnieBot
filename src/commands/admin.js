const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const GuildConfigService = require('../services/GuildConfigService');
const XpService = require('../services/XpService');
const EconomyService = require('../services/EconomyService');
const UserRepository = require('../repositories/UserRepository');
const ResetService = require('../services/ResetService');
const LevelRoleRepository = require('../repositories/LevelRoleRepository');
const { isAdmin } = require('../utils/permissions');

function adminOnly(interaction) {
  if (!isAdmin(interaction)) {
    interaction.reply({ content: 'Administrator permission required.', ephemeral: true });
    return false;
  }
  return true;
}

const d = (o, desc) => o.setDescription(desc);

const commands = [
  { name: 'setxprate', desc: 'Set voice XP per minute', opts: (b) => b.addNumberOption((o) => d(o.setName('amount').setRequired(true).setMinValue(0.1), 'XP per minute')), run: (i) => GuildConfigService.setVoiceXpRate(i.guild.id, i.options.getNumber('amount'), i.user.id) },
  { name: 'settextxprate', desc: 'Set text XP min/max', opts: (b) => b.addIntegerOption((o) => d(o.setName('min').setRequired(true), 'Minimum XP')).addIntegerOption((o) => d(o.setName('max').setRequired(true), 'Maximum XP')), run: (i) => GuildConfigService.setTextXpRate(i.guild.id, i.options.getInteger('min'), i.options.getInteger('max'), i.user.id) },
  { name: 'settextcooldown', desc: 'Set text XP cooldown seconds', opts: (b) => b.addIntegerOption((o) => d(o.setName('seconds').setRequired(true).setMinValue(0), 'Cooldown in seconds')), run: (i) => GuildConfigService.setTextCooldown(i.guild.id, i.options.getInteger('seconds'), i.user.id) },
  { name: 'setdailycap', desc: 'Set daily XP cap', opts: (b) => b.addIntegerOption((o) => d(o.setName('amount').setRequired(true).setMinValue(0), 'Daily XP cap')), run: (i) => GuildConfigService.setDailyCap(i.guild.id, i.options.getInteger('amount'), i.user.id) },
  { name: 'setlogchannel', desc: 'Set log channel', opts: (b) => b.addChannelOption((o) => d(o.setName('channel').setRequired(true), 'Log channel')), run: (i) => GuildConfigService.setLogChannel(i.guild.id, i.options.getChannel('channel').id, i.user.id) },
  { name: 'setlevelrole', desc: 'Set level reward role', opts: (b) => b.addIntegerOption((o) => d(o.setName('level').setRequired(true).setMinValue(1), 'Level')).addRoleOption((o) => d(o.setName('role').setRequired(true), 'Role to award')), run: (i) => GuildConfigService.setLevelRole(i.guild.id, i.options.getInteger('level'), i.options.getRole('role').id, i.user.id) },
  { name: 'removelevelrole', desc: 'Remove level reward role', opts: (b) => b.addIntegerOption((o) => d(o.setName('level').setRequired(true), 'Level')), run: (i) => GuildConfigService.removeLevelRole(i.guild.id, i.options.getInteger('level'), i.user.id) },
  { name: 'levelroles', desc: 'List level reward roles', opts: (b) => b, run: async (i) => { const roles = LevelRoleRepository.getAll(i.guild.id); return roles.map((r) => `Level ${r.level}: <@&${r.role_id}>`).join('\n') || 'None configured.'; }, replyTransform: true },
  { name: 'whitelistchannel', desc: 'Whitelist a channel', opts: (b) => b.addChannelOption((o) => d(o.setName('channel').setRequired(true), 'Channel')), run: (i) => GuildConfigService.whitelistChannel(i.guild.id, i.options.getChannel('channel').id, 'both', i.user.id) },
  { name: 'blacklistchannel', desc: 'Blacklist a channel', opts: (b) => b.addChannelOption((o) => d(o.setName('channel').setRequired(true), 'Channel')), run: (i) => GuildConfigService.blacklistChannel(i.guild.id, i.options.getChannel('channel').id, 'both', i.user.id) },
  { name: 'unwhitelistchannel', desc: 'Remove channel whitelist', opts: (b) => b.addChannelOption((o) => d(o.setName('channel').setRequired(true), 'Channel')), run: (i) => GuildConfigService.unwhitelistChannel(i.guild.id, i.options.getChannel('channel').id, i.user.id) },
  { name: 'unblacklistchannel', desc: 'Remove channel blacklist', opts: (b) => b.addChannelOption((o) => d(o.setName('channel').setRequired(true), 'Channel')), run: (i) => GuildConfigService.unblacklistChannel(i.guild.id, i.options.getChannel('channel').id, i.user.id) },
  { name: 'whitelistcategory', desc: 'Whitelist a category', opts: (b) => b.addChannelOption((o) => d(o.setName('category').setRequired(true).addChannelTypes(ChannelType.GuildCategory), 'Category')).addStringOption((o) => d(o.setName('type').setRequired(true).addChoices({ name: 'Voice', value: 'voice' }, { name: 'Text', value: 'text' }), 'Voice or text')), run: (i) => GuildConfigService.whitelistCategory(i.guild.id, i.options.getChannel('category').id, i.options.getString('type'), i.user.id) },
  { name: 'blacklistcategory', desc: 'Blacklist a category', opts: (b) => b.addChannelOption((o) => d(o.setName('category').setRequired(true).addChannelTypes(ChannelType.GuildCategory), 'Category')).addStringOption((o) => d(o.setName('type').setRequired(true).addChoices({ name: 'Voice', value: 'voice' }, { name: 'Text', value: 'text' }), 'Voice or text')), run: (i) => GuildConfigService.blacklistCategory(i.guild.id, i.options.getChannel('category').id, i.options.getString('type'), i.user.id) },
  { name: 'unwhitelistcategory', desc: 'Remove category whitelist', opts: (b) => b.addChannelOption((o) => d(o.setName('category').setRequired(true).addChannelTypes(ChannelType.GuildCategory), 'Category')).addStringOption((o) => d(o.setName('type').setRequired(true).addChoices({ name: 'Voice', value: 'voice' }, { name: 'Text', value: 'text' }), 'Voice or text')), run: (i) => GuildConfigService.unwhitelistCategory(i.guild.id, i.options.getChannel('category').id, i.options.getString('type'), i.user.id) },
  { name: 'unblacklistcategory', desc: 'Remove category blacklist', opts: (b) => b.addChannelOption((o) => d(o.setName('category').setRequired(true).addChannelTypes(ChannelType.GuildCategory), 'Category')).addStringOption((o) => d(o.setName('type').setRequired(true).addChoices({ name: 'Voice', value: 'voice' }, { name: 'Text', value: 'text' }), 'Voice or text')), run: (i) => GuildConfigService.unblacklistCategory(i.guild.id, i.options.getChannel('category').id, i.options.getString('type'), i.user.id) },
  { name: 'setchannelbonus', desc: 'Set channel XP multiplier', opts: (b) => b.addChannelOption((o) => d(o.setName('channel').setRequired(true), 'Channel')).addNumberOption((o) => d(o.setName('multiplier').setRequired(true).setMinValue(0.1), 'Multiplier')), run: (i) => GuildConfigService.setChannelBonus(i.guild.id, i.options.getChannel('channel').id, i.options.getNumber('multiplier'), i.user.id) },
  { name: 'removechannelbonus', desc: 'Remove channel XP bonus', opts: (b) => b.addChannelOption((o) => d(o.setName('channel').setRequired(true), 'Channel')), run: (i) => GuildConfigService.removeChannelBonus(i.guild.id, i.options.getChannel('channel').id, i.user.id) },
  { name: 'addxp', desc: 'Add XP to a user', opts: (b) => b.addUserOption((o) => d(o.setName('user').setRequired(true), 'User')).addIntegerOption((o) => d(o.setName('amount').setRequired(true), 'XP amount')), run: (i) => XpService.adminAdjust(i.options.getUser('user').id, i.guild.id, i.options.getInteger('amount'), i.user.id) },
  { name: 'removexp', desc: 'Remove XP from a user', opts: (b) => b.addUserOption((o) => d(o.setName('user').setRequired(true), 'User')).addIntegerOption((o) => d(o.setName('amount').setRequired(true), 'XP amount')), run: (i) => XpService.adminAdjust(i.options.getUser('user').id, i.guild.id, -i.options.getInteger('amount'), i.user.id) },
  { name: 'resetxp', desc: 'Reset user XP', opts: (b) => b.addUserOption((o) => d(o.setName('user').setRequired(true), 'User')), run: (i) => XpService.resetXp(i.options.getUser('user').id, i.guild.id, i.user.id) },
  { name: 'addcoins', desc: 'Add coins to a user', opts: (b) => b.addUserOption((o) => d(o.setName('user').setRequired(true), 'User')).addIntegerOption((o) => d(o.setName('amount').setRequired(true), 'Coin amount')), run: (i) => EconomyService.addCoins(i.options.getUser('user').id, i.guild.id, i.options.getInteger('amount'), 'admin', i.user.id) },
  { name: 'removecoins', desc: 'Remove coins from a user', opts: (b) => b.addUserOption((o) => d(o.setName('user').setRequired(true), 'User')).addIntegerOption((o) => d(o.setName('amount').setRequired(true), 'Coin amount')), run: (i) => EconomyService.removeCoins(i.options.getUser('user').id, i.guild.id, i.options.getInteger('amount'), i.user.id) },
  { name: 'resetuser', desc: 'Reset all user data', opts: (b) => b.addUserOption((o) => d(o.setName('user').setRequired(true), 'User')), run: (i) => UserRepository.resetUser(i.options.getUser('user').id, i.guild.id) },
  { name: 'forceseasonreset', desc: 'Force seasonal XP reset', opts: (b) => b, run: (i) => ResetService.seasonReset(i.guild.id, i.user.id) },
  { name: 'forceweeklyreset', desc: 'Force weekly XP reset', opts: (b) => b, run: (i) => ResetService.weeklyReset(i.guild.id, i.user.id) },
];

module.exports = commands.map((c) => {
  let builder = new SlashCommandBuilder()
    .setName(c.name)
    .setDescription(c.desc)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
  if (c.opts) builder = c.opts(builder);
  return {
    data: builder,
    async execute(interaction) {
      if (!adminOnly(interaction)) return;
      const result = await c.run(interaction);
      const msg = c.replyTransform ? (result || 'None configured.') : `✅ **${c.name}** applied successfully.`;
      await interaction.reply({ content: String(msg), ephemeral: true });
    },
  };
});
