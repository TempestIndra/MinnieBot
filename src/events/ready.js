const VoiceService = require('../services/VoiceService');
const cron = require('node-cron');
const ResetService = require('../services/ResetService');
const config = require('../config');
const { getBotInviteUrl } = require('../utils/invite');
const botRegistry = require('../discord/botRegistry');
const logger = require('../utils/logger').child('bot');

module.exports = {
  name: 'clientReady',
  once: true,
  execute(client) {
    botRegistry.syncGuildsFromCache();
    logger.info(`Logged in as ${client.user.tag} (${client.guilds.cache.size} servers)`);
    logger.info(`Invite link: ${getBotInviteUrl(client.user.id)}`);
    VoiceService.initTick(client);

    cron.schedule(config.resets.weeklyCron, () => {
      logger.info('Weekly XP reset (cron)');
      ResetService.resetAllGuilds(client, 'weekly');
    });

    cron.schedule(config.resets.seasonCron, () => {
      logger.info('Season XP reset (cron)');
      ResetService.resetAllGuilds(client, 'season');
    });

    client.user.setActivity('XP & Levels | /profile');
  },
};
