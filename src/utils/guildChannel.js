const botRegistry = require('../discord/botRegistry');

/**
 * Ensure a channel ID belongs to the given guild and is a sendable text channel.
 */
async function validateGuildTextChannel(guildId, channelId) {
  const id = (channelId || '').trim();
  if (!id) return { ok: true };

  const client = botRegistry.getClient();
  const guild = client?.guilds?.cache?.get(guildId)
    ?? await client?.guilds?.fetch(guildId).catch(() => null);

  if (!guild) {
    return { ok: true, skipped: true };
  }

  try {
    const channel = await guild.channels.fetch(id);
    if (!channel?.isTextBased()) {
      return {
        ok: false,
        error: 'That ID is not a text channel in this server.',
      };
    }
    if (typeof channel.isSendable === 'function' && !channel.isSendable()) {
      return {
        ok: false,
        error: 'Minnie cannot send messages in that channel. Check channel permissions.',
      };
    }
    return { ok: true, channelName: channel.name };
  } catch (err) {
    if (err.message?.includes('does not belong')) {
      return {
        ok: false,
        error: `Channel ID ${id} is from a different Discord server. Open **this** server (${guild.name}), right-click the channel → Copy Channel ID, and paste that here.`,
      };
    }
    return {
      ok: false,
      error: `Channel ${id} was not found in **${guild.name}**. Copy Channel ID from a channel in this server (Developer Mode must be on).`,
    };
  }
}

module.exports = { validateGuildTextChannel };
