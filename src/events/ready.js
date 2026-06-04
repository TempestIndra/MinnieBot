const VoiceService = require('../services/VoiceService');
const cron = require('node-cron');
const ResetService = require('../services/ResetService');
const config = require('../config');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`[Bot] Logged in as ${client.user.tag}`);
    VoiceService.initTick(client);

    cron.schedule(config.resets.weeklyCron, () => {
      console.log('[Cron] Weekly reset');
      ResetService.resetAllGuilds(client, 'weekly');
    });

    cron.schedule(config.resets.seasonCron, () => {
      console.log('[Cron] Season reset');
      ResetService.resetAllGuilds(client, 'season');
    });

    client.user.setActivity('XP & Levels | /profile');
  },
};
