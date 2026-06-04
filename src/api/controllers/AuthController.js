const jwt = require('jsonwebtoken');
const config = require('../../config');

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

  async callback(req, res) {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: 'Missing code' });

    const tokenRes = await fetch(`${DISCORD_API}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.discord.clientId,
        client_secret: config.discord.clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.oauth.redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return res.status(400).json({ error: 'OAuth failed', details: tokenData });

    const userRes = await fetch(`${DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const user = await userRes.json();

    const guildsRes = await fetch(`${DISCORD_API}/users/@me/guilds`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const guilds = await guildsRes.json();

    const adminGuilds = guilds.filter((g) => (BigInt(g.permissions) & BigInt(0x8)) === BigInt(0x8));

    const token = jwt.sign(
      { id: user.id, username: user.username, avatar: user.avatar, guilds: adminGuilds },
      config.api.jwtSecret,
      { expiresIn: '7d' }
    );

    res.cookie('minnie_token', token, {
      httpOnly: true,
      secure: config.isDev ? false : true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const dashboardUrl = process.env.DASHBOARD_URL || 'http://localhost:3000';
    res.redirect(`${dashboardUrl}/dashboard`);
  }

  me(req, res) {
    res.json({ user: req.user });
  }

  logout(req, res) {
    res.clearCookie('minnie_token');
    res.json({ ok: true });
  }
}

module.exports = new AuthController();
