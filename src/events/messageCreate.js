const TextXpService = require('../services/TextXpService');
const LevelService = require('../services/LevelService');

module.exports = {
  name: 'messageCreate',
  async execute(message, { client }) {
    if (!message.guild || message.author.bot) return;

    const result = await TextXpService.processMessage(message);
    if (result.leveledUp) {
      const member = await message.guild.members.fetch(message.author.id).catch(() => null);
      if (member) await LevelService.handleLevelUp(message.guild, member, result.oldLevel, result.newLevel);
    }
  },
};
