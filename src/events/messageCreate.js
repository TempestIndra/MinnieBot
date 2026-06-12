const TextXpService = require('../services/TextXpService');
const logger = require('../utils/logger').child('messages');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (!message.guild || message.author.bot) return;

    try {
      await TextXpService.processMessage(message);
    } catch (err) {
      logger.exception('messageCreate', err);
    }
  },
};
