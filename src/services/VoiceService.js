const XpService = require('./XpService');
const ChannelEligibilityService = require('./ChannelEligibilityService');
const GuildSettingsRepository = require('../repositories/GuildSettingsRepository');
const LogRepository = require('../repositories/LogRepository');
const VoiceSessionRepository = require('../repositories/VoiceSessionRepository');
const QuestService = require('./QuestService');
const config = require('../config');

/** Active voice states: Map<`${guildId}-${userId}`, VoiceState> */
const activeSessions = new Map();

class VoiceService {
  constructor() {
    this._muteToggleCounts = new Map();
  }

  handleJoin(member, channel) {
    if (member.user.bot) return;
    this._startSession(member, channel);
  }

  handleLeave(member, channel) {
    if (member.user.bot) return;
    this._endSession(member.guild.id, member.id);
  }

  handleSwitch(member, oldChannel, newChannel) {
    if (member.user.bot) return;
    this._endSession(member.guild.id, member.id);
    this._startSession(member, newChannel);
  }

  _sessionKey(guildId, userId) {
    return `${guildId}-${userId}`;
  }

  _startSession(member, channel) {
    const key = this._sessionKey(member.guild.id, member.id);
    const sessionId = VoiceSessionRepository.start(member.id, member.guild.id, channel.id);
    activeSessions.set(key, {
      sessionId,
      guildId: member.guild.id,
      userId: member.id,
      channelId: channel.id,
      joinedAt: Date.now(),
      validMinutes: 0,
      lastTick: Date.now(),
      hadOthers: false,
    });
  }

  _endSession(guildId, userId) {
    const key = this._sessionKey(guildId, userId);
    const session = activeSessions.get(key);
    if (!session) return;
    activeSessions.delete(key);
    const duration = Math.floor((Date.now() - session.joinedAt) / 1000);
    VoiceSessionRepository.end(session.sessionId, duration, session.validMinutes * (GuildSettingsRepository.get(guildId).voice_xp_rate || 5), true);
  }

  /**
   * Called every 60s for all active voice sessions
   */
  tick(client) {
    for (const [key, session] of activeSessions) {
      const guild = client.guilds.cache.get(session.guildId);
      if (!guild) continue;

      const member = guild.members.cache.get(session.userId);
      if (!member?.voice?.channel) {
        this._endSession(session.guildId, session.userId);
        continue;
      }

      const check = this._validateVoiceState(member, guild);
      if (!check.valid) {
        if (check.suspicious) {
          LogRepository.logSuspicious(session.userId, session.guildId, check.reason, check.details);
        }
        continue;
      }

      if (check.hadOthers) session.hadOthers = true;

      const settings = GuildSettingsRepository.get(session.guildId);
      const eligibility = ChannelEligibilityService.canEarnXp(guild, member.voice.channel.id, 'voice');
      if (!eligibility.allowed) continue;

      const rate = settings.voice_xp_rate || config.defaults.voiceXpRate;
      const amount = Math.floor(rate * (eligibility.multiplier || 1));

      const result = XpService.award(session.userId, session.guildId, {
        amount,
        source: 'voice',
        username: member.user.username,
        voice: amount,
        voiceTime: 60,
        guild,
        member,
      });

      if (result.awarded > 0) {
        session.validMinutes += 1;
        QuestService.trackVoiceMinutes(session.userId, session.guildId, 1);
        if (session.hadOthers) QuestService.trackVoiceWithOthers(session.userId, session.guildId);
      }
    }
  }

  _validateVoiceState(member, guild) {
    const voice = member.voice;
    const channel = voice.channel;

    if (!channel) return { valid: false, reason: 'not_in_channel' };
    if (member.user.bot) return { valid: false, reason: 'bot' };

    const afkId = guild.afkChannelId;
    if (afkId && channel.id === afkId) return { valid: false, reason: 'afk_channel', suspicious: true };

    if (voice.selfMute || voice.serverMute) return { valid: false, reason: 'muted' };
    if (voice.selfDeaf || voice.serverDeaf) return { valid: false, reason: 'deafened' };

    const humans = channel.members.filter((m) => !m.user.bot);
    if (humans.size <= 1) return { valid: false, reason: 'alone_in_channel' };

    const eligibility = ChannelEligibilityService.canEarnXp(guild, channel.id, 'voice');
    if (!eligibility.allowed) return { valid: false, reason: eligibility.reason };

    const muteKey = `${guild.id}-${member.id}-mute`;
    if (voice.selfMute || voice.serverMute) {
      const count = (this._muteToggleCounts.get(muteKey) || 0) + 1;
      this._muteToggleCounts.set(muteKey, count);
      if (count > 10) {
        return { valid: false, reason: 'mute_abuse', suspicious: true, details: `toggle count ${count}` };
      }
    }

    return { valid: true, hadOthers: humans.size > 1 };
  }

  initTick(client) {
    setInterval(() => this.tick(client), config.voice.tickIntervalMs);
  }
}

module.exports = new VoiceService();
