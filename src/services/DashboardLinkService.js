const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const GuildSettingsRepository = require('../repositories/GuildSettingsRepository');
const config = require('../config');

function getDashboardConfig(guildId) {
  const settings = GuildSettingsRepository.get(guildId);
  const defaults = config.dashboard;

  return {
    url: settings.dashboard_url || defaults.url,
    linkText: settings.dashboard_link_text || defaults.linkText,
    title: settings.dashboard_embed_title || defaults.embedTitle,
    description: settings.dashboard_embed_description || defaults.embedDescription,
  };
}

function buildDashboardPayload(guild) {
  const cfg = getDashboardConfig(guild.id);
  const safeUrl = cfg.url.startsWith('http') ? cfg.url : `https://${cfg.url}`;

  const description = `${cfg.description}\n\n**[${cfg.linkText}](${safeUrl})**`;

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(cfg.title)
    .setDescription(description)
    .setURL(safeUrl)
    .setFooter({ text: `${guild.name} • Admin access required` })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel(cfg.linkText.slice(0, 80))
      .setStyle(ButtonStyle.Link)
      .setURL(safeUrl)
  );

  return { embeds: [embed], components: [row] };
}

function isValidUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

module.exports = {
  getDashboardConfig,
  buildDashboardPayload,
  isValidUrl,
};
