const jwt = require('jsonwebtoken');
const config = require('../../config');
const BotGuildService = require('../../services/BotGuildService');
const { getBotInviteUrl } = require('../../utils/invite');

const DISCORD_API = 'https://discord.com/api/v10';

class AuthController {
  getLoginUrl(req, res) {
    const params = new URLSearchParams({
      client_id: config.discord.clientId,
      redirect_uri: config.oauth.redirectUri,
      response_type: 'code',
      scope: config.oauth.scopes.join(' '),
    });
    res.json({ url: `https://discord.com/oauth2/authorize?${params}` });
  }

  /**
   * Exchange Discord OAuth code for JWT (used by Next.js callback route).
   */
  async exchangeOAuthCode(code) {
    if (!code) return { ok: false, error: 'Missing authorization code' };

    const { clientId, clientSecret } = config.discord;
    if (!clientId || !clientSecret) {
      return { ok: false, error: 'Server missing DISCORD_CLIENT_ID or DISCORD_CLIENT_SECRET in .env' };
    }

    const tokenRes = await fetch(`${DISCORD_API}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.oauth.redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      const msg = tokenData.error === 'invalid_client'
        ? 'Invalid client — use OAuth2 Client Secret (not bot token) in DISCORD_CLIENT_SECRET'
        : tokenData.error === 'invalid_grant'
          ? `Redirect URI mismatch — add ${config.oauth.redirectUri} in Developer Portal → OAuth2 → Redirects`
          : `Discord OAuth error: ${tokenData.error || 'unknown'}`;
      return { ok: false, error: msg };
    }

    const userRes = await fetch(`${DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const user = await userRes.json();
    if (!user.id) return { ok: false, error: 'Could not load Discord profile' };

    const guildsRes = await fetch(`${DISCORD_API}/users/@me/guilds`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const guilds = await guildsRes.json();
    const guildList = Array.isArray(guilds) ? guilds : [];

    const adminGuilds = guildList
      .filter((g) => (BigInt(g.permissions) & 8n) === 8n)
      .map((g) => ({ id: g.id, name: g.name, permissions: g.permissions }));

    const guildsWithBot = await BotGuildService.filterAdminGuildsWithBotAsync(adminGuilds);

    const token = jwt.sign(
      { id: user.id, username: user.username, avatar: user.avatar, guilds: guildsWithBot },
      config.api.jwtSecret,
      { expiresIn: '7d' }
    );

    return {
      ok: true,
      token,
      user: { id: user.id, username: user.username, avatar: user.avatar, guilds: guildsWithBot },
    };
  }

  async exchange(req, res) {
    const code = req.query.code || req.body?.code;
    const result = await this.exchangeOAuthCode(code);
    if (!result.ok) return res.status(400).json({ error: result.error });
    res.json({ token: result.token, user: result.user });
  }

  /** Legacy direct callback (optional); prefer Next.js /api/auth/callback */
  async callback(req, res) {
    const dashboardUrl = process.env.DASHBOARD_URL || 'http://localhost:3000';
    const result = await this.exchangeOAuthCode(req.query.code);
    if (!result.ok) {
      return res.redirect(`${dashboardUrl}/login?error=${encodeURIComponent(result.error)}`);
    }
    res.redirect(`${dashboardUrl}/auth/complete?token=${encodeURIComponent(result.token)}`);
  }

  me(req, res) {
    const guildsWithBot = BotGuildService.filterAdminGuildsWithBot(req.user.guilds || []);
    res.json({
      user: { ...req.user, guilds: guildsWithBot },
      inviteUrl: getBotInviteUrl(config.discord.clientId),
    });
  }

  logout(req, res) {
    res.clearCookie('minnie_token', { path: '/' });
    res.json({ ok: true });
  }
}

module.exports = new AuthController();
