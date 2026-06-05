const { SlashCommandBuilder } = require('discord.js');
const GuildConfigService = require('../services/GuildConfigService');
const { buildDashboardPayload, isValidUrl } = require('../services/DashboardLinkService');
const { isAdmin } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setdashboard')
    .setDescription('Customize the /dashboard embed text and link (Admin)')
    .addStringOption((o) =>
      o.setName('link_text').setDescription('Button and hyperlink label (e.g. "Open our dashboard")'))
    .addStringOption((o) =>
      o.setName('title').setDescription('Embed title'))
    .addStringOption((o) =>
      o.setName('description').setDescription('Embed description (hyperlink is added automatically)'))
    .addStringOption((o) =>
      o.setName('url').setDescription('Dashboard URL (must start with http:// or https://)')),
  async execute(interaction) {
    if (!isAdmin(interaction)) {
      return interaction.reply({ content: 'Administrator permission required.', ephemeral: true });
    }

    const fields = {};
    const linkText = interaction.options.getString('link_text');
    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description');
    const url = interaction.options.getString('url');

    if (linkText) fields.dashboard_link_text = linkText.slice(0, 80);
    if (title) fields.dashboard_embed_title = title.slice(0, 256);
    if (description) fields.dashboard_embed_description = description.slice(0, 2000);
    if (url) {
      if (!isValidUrl(url)) {
        return interaction.reply({ content: 'URL must be a valid http:// or https:// link.', ephemeral: true });
      }
      fields.dashboard_url = url;
    }

    if (!Object.keys(fields).length) {
      return interaction.reply({
        content: 'Provide at least one option: `link_text`, `title`, `description`, or `url`.',
        ephemeral: true,
      });
    }

    GuildConfigService.updateSettings(interaction.guild.id, fields, interaction.user.id);

    const preview = buildDashboardPayload(interaction.guild);
    await interaction.reply({
      content: '✅ Dashboard message updated. Preview:',
      ...preview,
      ephemeral: true,
    });
  },
};
