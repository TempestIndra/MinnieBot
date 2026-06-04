const VoiceService = require('../services/VoiceService');

module.exports = {
  name: 'voiceStateUpdate',
  execute(oldState, newState) {
    const member = newState.member || oldState.member;
    if (!member || member.user.bot) return;

    const guild = newState.guild || oldState.guild;
    if (!guild) return;

    const oldChannel = oldState.channel;
    const newChannel = newState.channel;

    if (!oldChannel && newChannel) {
      VoiceService.handleJoin(member, newChannel);
    } else if (oldChannel && !newChannel) {
      VoiceService.handleLeave(member, oldChannel);
    } else if (oldChannel && newChannel && oldChannel.id !== newChannel.id) {
      VoiceService.handleSwitch(member, oldChannel, newChannel);
    }
  },
};
