const { escapeMarkdown } = require('@discordjs/formatters');

/**
 * Escape user-controlled text for Discord embeds/messages (|| spoilers, * bold, etc.).
 */
function escapeDisplayName(name) {
  if (!name) return 'Unknown';
  return escapeMarkdown(String(name), {
    spoiler: true,
    strikethrough: true,
    underline: true,
    heading: true,
  });
}

module.exports = { escapeDisplayName };
