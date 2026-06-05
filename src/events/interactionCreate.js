const logger = require('../utils/logger').child('commands');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, { commandMap }) {
    if (interaction.isAutocomplete()) {
      const cmd = commandMap.get(interaction.commandName);
      if (cmd?.autocomplete) return cmd.autocomplete(interaction);
      return;
    }
    if (!interaction.isChatInputCommand()) return;

    const cmd = commandMap.get(interaction.commandName);
    if (!cmd) return;

    try {
      await cmd.execute(interaction);
    } catch (err) {
      logger.exception(interaction.commandName, err);
      const payload = { content: 'An error occurred running this command.', ephemeral: true };
      if (interaction.replied || interaction.deferred) await interaction.followUp(payload);
      else await interaction.reply(payload);
    }
  },
};
