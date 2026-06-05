# Minnie XP Bot

Production-ready Discord XP bot with voice/text rewards, levels, prestige, coins, quests, role shop, and a **dashboard-first** admin panel.

## Stack

| Layer | Technology |
|-------|------------|
| Bot | Node.js, discord.js v14 |
| Database | SQLite (better-sqlite3) |
| API | Express.js, REST, Socket.io |
| Dashboard | Next.js 14, React, Tailwind CSS |
| Auth | Discord OAuth2 (admin guilds only) |

## Architecture

```
Dashboard (Next.js)
       ↓ REST + WebSocket
   Express API
       ↓
  Service Layer  ← Discord slash commands
       ↓
  Repositories → SQLite
```

Slash commands and the dashboard both use the same services (`GuildConfigService`, `XpService`, etc.).

## Quick Start

### 1. Create a Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create an application → **Bot** → copy token
3. Enable **Message Content Intent** and **Server Members Intent**
4. OAuth2 → add redirect: `http://localhost:3000/api/auth/callback`
5. Copy **Client ID** and **Client Secret**

### 2. Invite the Bot

When you run `npm start`, the **bot invite link** is printed in the terminal. Copy it and open it in your browser to add Minnie to a server.

#### OAuth2 URL Generator (Developer Portal)

You need **two different** OAuth setups:

| Purpose | Scopes to check | Other settings |
|---------|-----------------|----------------|
| **Add bot to server** | `bot`, `applications.commands` | Bot permissions: View Channels, Send Messages, Embed Links, Read Message History, Manage Roles |
| **Dashboard login** | `identify`, `guilds` | OAuth2 → Redirects: `http://localhost:3000/auth/discord/callback` |

The bot invite URL is generated automatically on startup — you do not need to build it by hand unless you prefer the portal tool.

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your token, client ID, and secrets.

### 4. Install & Run

```bash
npm run install:all
npm run deploy-commands
npm start
```

`npm start` runs a **supervisor** that logs everything to `./logs/` and **auto-restarts** the bot if it crashes (up to 15 times per 10 minutes).

| Log file | Contents |
|----------|----------|
| `logs/minnie-YYYY-MM-DD.log` | All output for that day |
| `logs/crashes.log` | Errors, exceptions, crash reports |

Run without supervisor: `npm run start:worker`

In a second terminal:

```bash
npm run dashboard:dev
```

- Bot + API: `http://localhost:4000`
- Dashboard: `http://localhost:3000` (proxies `/api/*` to Express so login cookies work)

**Both must be running** for dashboard login (`npm start` + `npm run dashboard:dev`).

### 5. Login to Dashboard

Open `http://localhost:3000` → **Login with Discord** → select a server you administrate.

#### OAuth `invalid_client` troubleshooting

| Check | Where |
|-------|--------|
| `DISCORD_CLIENT_ID` = **Application ID** | Developer Portal → **General Information** |
| `DISCORD_CLIENT_SECRET` = **OAuth2 Client Secret** | Developer Portal → **OAuth2** → Client Secret (not Bot token) |
| Redirect URI matches `.env` exactly | OAuth2 → **Redirects** → `http://localhost:3000/auth/discord/callback` |
| No extra quotes/spaces in `.env` | Restart API after editing |

If you reset the Client Secret in the portal, update `.env` and restart `npm start`.

## Slash Commands

| Category | Commands |
|----------|----------|
| User | `/profile`, `/rank`, `/leaderboard`, `/prestige`, `/balance`, `/shop`, `/buy`, `/quests`, `/claimquest`, `/dashboard` |
| Dashboard | `/setdashboard` — customize embed title, description, link label, and URL (Admin) |
| Economy | `/givecoins` |
| Admin | `/setxprate`, `/settextxprate`, `/settextcooldown`, `/setdailycap`, `/setlevelrole`, `/levelroles`, channel/category rules, `/addxp`, `/resetuser`, etc. |

All admin settings are also available in the dashboard.

## XP Rules

- **Voice**: 5 XP/min (configurable), tick every 60s. No XP if alone, muted, deafened, AFK channel, or blacklisted.
- **Text**: Random 5–10 XP (configurable), 60s cooldown, anti-spam, min length, no duplicates.
- **Level formula**: `100 × Level^1.5`
- **Daily cap**: 500 XP (resets midnight UTC)
- **Weekly reset**: Monday 00:00 UTC
- **Season reset**: 1st of month

## Project Structure

```
src/
├── index.js              # Bot + API entry
├── bot.js                # Discord client
├── api-server.js         # Express + Socket.io
├── deploy-commands.js
├── commands/             # Slash commands
├── events/
├── services/             # Shared business logic
├── repositories/
├── api/controllers/
└── database/
dashboard/                # Next.js admin UI
schema.sql
```

## Hosting on Proxmox

See **[docs/DEPLOY-PROXMOX.md](docs/DEPLOY-PROXMOX.md)** for a full guide (VM setup, systemd, Nginx, SSL, Discord OAuth in production). Service templates are in `deploy/`.

## Production Notes

- Set `NODE_ENV=production`, strong `SESSION_SECRET` / `JWT_SECRET`
- Use HTTPS and update `OAUTH_REDIRECT_URI`, `DASHBOARD_URL`, `NEXT_PUBLIC_API_URL`
- SQLite path: `DATABASE_PATH` — migrate to PostgreSQL by swapping `connection.js`
- Scale: Redis cache, Discord sharding, multiple API instances behind a load balancer

## License

MIT
