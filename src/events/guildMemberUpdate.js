const UserRepository = require('../repositories/UserRepository');
const { displayName } = require('../utils/usernames');

module.exports = {
  name: 'guildMemberUpdate',
  async execute(oldMember, newMember) {
    if (newMember.user.bot) return;
    const name = displayName(newMember);
    if (!name) return;

    const existing = UserRepository.findById(newMember.guild.id, newMember.id);
    if (!existing) return;
    if (existing.username === name) return;

    UserRepository.update(newMember.id, newMember.guild.id, { username: name });
  },
};
