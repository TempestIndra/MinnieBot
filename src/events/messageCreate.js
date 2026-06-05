const TextXpService = require('../services/TextXpService');
const LevelService = require('../services/LevelService');
const logger = require('../utils/logger').child('messages');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (!message.guild || message.author.bot) return;

    try {
      const result = await TextXpService.processMessage(message);
      if (result?.leveledUp) {
        const member = await message.guild.members.fetch(message.author.id).catch(() => null);
        if (member) await LevelService.handleLevelUp(message.guild, member, result.oldLevel, result.newLevel);
      }
    } catch (err) {
      logger.exception('messageCreate', err);
    }
  },
};
