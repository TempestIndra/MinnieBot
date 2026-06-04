const UserRepository = require('../repositories/UserRepository');
const GuildSettingsRepository = require('../repositories/GuildSettingsRepository');
const LogRepository = require('../repositories/LogRepository');

class PrestigeService {
  canPrestige(userId, guildId) {
    const settings = GuildSettingsRepository.get(guildId);
    const user = UserRepository.getOrCreate(userId, guildId);
    if (user.prestige >= settings.prestige_max) return { ok: false, reason: 'max_prestige' };
    if (user.level < settings.max_level) return { ok: false, reason: 'not_max_level', required: settings.max_level };
    return { ok: true, user, settings };
  }

  async prestige(guild, member) {
    const check = this.canPrestige(member.id, guild.id);
    if (!check.ok) return check;

    const newPrestige = check.user.prestige + 1;
    UserRepository.update(member.id, guild.id, {
      level: 1,
      prestige: newPrestige,
      total_xp: 0,
      voice_xp: 0,
      text_xp: 0,
    });

    LogRepository.logAdmin(guild.id, member.id, 'prestige', member.id, `Prestige ${newPrestige}`);

    const settings = check.settings;
    if (settings.prestige_role_id) {
      const role = guild.roles.cache.get(settings.prestige_role_id);
      if (role) await member.roles.add(role).catch(() => {});
    }

    return { ok: true, prestige: newPrestige };
  }
}

module.exports = new PrestigeService();
