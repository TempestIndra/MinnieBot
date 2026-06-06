# Hosting Minnie on Proxmox

Proxmox runs **virtual machines (VMs)** or **LXC containers**. For this project, use a **small Linux VM** (Debian 12 or Ubuntu 22.04+) — `better-sqlite3` compiles native code and VMs are simpler than LXC for that.

## Architecture on the server

```
Internet
    ↓
Nginx/Caddy (443) ──→ Dashboard (Next.js :3000)
                   └──→ API proxy /api → Express (:4000)
Supervisor (systemd) ──→ Bot + API worker
SQLite + logs on disk
```

Only **80/443** should be public. Bot connects **outbound** to Discord (no inbound port needed for the bot).

---

## 1. Create the VM in Proxmox

1. Proxmox UI → **Create VM**
2. **OS**: Debian 12 or Ubuntu 22.04 ISO
3. **Resources** (small server is enough):
   - 2 vCPU
   - 2 GB RAM
   - 20 GB disk
4. Install OS with OpenSSH enabled
5. Note the VM IP (e.g. `192.168.1.50`) or assign a DNS name later

---

## 2. Prepare the VM

SSH in as root or your user:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl build-essential nginx certbot python3-certbot-nginx

# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

node -v   # should be v20+
npm -v
```

Create app user (recommended):

```bash
sudo useradd -m -s /bin/bash minnie
sudo mkdir -p /opt/minnie
sudo chown minnie:minnie /opt/minnie
```

---

## 3. Deploy the code

As `minnie` user:

```bash
sudo -u minnie -i
cd /opt/minnie
git clone <YOUR_REPO_URL> .
# or upload files with scp/rsync

npm run install:all
cd dashboard && npm run build && cd ..
```

---

## 4. Production `.env`

Edit `/opt/minnie/.env`:

```env
NODE_ENV=production

DISCORD_TOKEN=...
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...

# Public dashboard URL (HTTPS)
DASHBOARD_URL=https://minnie.yourdomain.com
OAUTH_REDIRECT_URI=https://minnie.yourdomain.com/auth/discord/callback

API_PORT=4000
API_URL=https://minnie.yourdomain.com
SESSION_SECRET=<long random string>
JWT_SECRET=<another long random string>

DATABASE_PATH=/opt/minnie/data/minnie.db
LOG_DIR=/opt/minnie/logs

# Dashboard build-time / runtime
API_BACKEND_URL=http://127.0.0.1:4000
NEXT_PUBLIC_WS_URL=https://minnie.yourdomain.com
```

**Discord Developer Portal** → OAuth2 → **Redirects** — add exactly:

```
https://minnie.yourdomain.com/auth/discord/callback
```

Rebuild dashboard after changing public URLs:

```bash
cd /opt/minnie/dashboard && npm run build
```

Deploy slash commands once (user commands only by default — edit `src/config/essential-commands.js` first):

```bash
cd /opt/minnie && npm run deploy-commands
```

---

## 5. systemd services

Copy service files from `deploy/`:

```bash
# If you deploy as user "nick" instead of "minnie", edit User=/Group= in both .service files first
sudo cp /opt/minnie/deploy/minnie-bot.service /etc/systemd/system/
sudo cp /opt/minnie/deploy/minnie-dashboard.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable minnie-bot minnie-dashboard
sudo systemctl start minnie-bot minnie-dashboard
sudo systemctl status minnie-bot minnie-dashboard
```

**`status=226/NAMESPACE` on minnie-bot:** Old service files used `ProtectSystem=strict` which breaks Node on some systems. Re-copy `minnie-bot.service` from the repo (hardening removed) and `daemon-reload` + `restart`.

**Wrong Node path:** Run `which node` — if not `/usr/bin/node`, update `ExecStart=` in `minnie-bot.service`.

Logs:

```bash
journalctl -u minnie-bot -f
journalctl -u minnie-dashboard -f
tail -f /opt/minnie/logs/minnie-$(date +%F).log
```

---

## 6. Subdomain setup (`minnie.yourdomain.com`)

You need three things: **DNS** → **traffic reaches your VM** → **Nginx + SSL on the VM**.

### Step A — Pick your subdomain

Example: `minnie.example.com` (replace `example.com` with your real domain).

### Step B — DNS (at your domain registrar or Cloudflare)

| Record type | Name | Value | Notes |
|-------------|------|-------|-------|
| **A** | `minnie` | Your **public IP** | Home server: your router’s WAN IP |
| **A** (Cloudflare proxy ON) | `minnie` | Same IP | Orange cloud = DDoS + free SSL at edge |

If your home IP changes, use a **Dynamic DNS** service (DuckDNS, No-IP, Cloudflare API) or **Cloudflare Tunnel** (no port forward).

Wait 5–30 minutes for DNS to propagate. Test: `ping minnie.yourdomain.com`

### Step C — Get traffic to the Ubuntu VM

**Option 1 — Port forward (home lab)**

On your router, forward to the **Ubuntu VM IP** (not Proxmox host IP unless you DNAT from host):

| External | Internal | VM |
|----------|----------|-----|
| TCP 80 → | 80 | `192.168.x.x` (Minnie VM) |
| TCP 443 → | 443 | same VM |

Proxmox itself does not need 80/443 unless you proxy from the Proxmox host.

**Option 2 — Cloudflare Tunnel (recommended if no static IP / no port forward)**

Full step-by-step: **[CLOUDFLARE-TUNNEL.md](CLOUDFLARE-TUNNEL.md)**

Short version on the VM:

```bash
sudo apt install -y cloudflared   # see CLOUDFLARE-TUNNEL.md for install commands
sudo cloudflared tunnel login
sudo cloudflared tunnel create minnie
sudo cp /opt/minnie/deploy/cloudflared-config.yml /etc/cloudflared/config.yml
# edit config.yml — set your subdomain
sudo cloudflared tunnel route dns minnie minnie.yourdomain.com
sudo cloudflared service install
# or: sudo cloudflared --config /etc/cloudflared/config.yml service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

Skip router port forward and Nginx; Cloudflare terminates HTTPS.

### Step D — App config (must match subdomain)

In `/opt/minnie/.env`:

```env
DASHBOARD_URL=https://minnie.yourdomain.com
OAUTH_REDIRECT_URI=https://minnie.yourdomain.com/auth/discord/callback
NEXT_PUBLIC_WS_URL=https://minnie.yourdomain.com
```

Discord Developer Portal → OAuth2 → **Redirects** → add the same `OAUTH_REDIRECT_URI`.

Rebuild dashboard and restart:

```bash
cd /opt/minnie/dashboard && npm run build && cd ..
sudo systemctl restart minnie-bot minnie-dashboard
```

---

## 7. Nginx reverse proxy + SSL

Replace `minnie.yourdomain.com` in `deploy/nginx-minnie.conf`, then:

```bash
sudo cp /opt/minnie/deploy/nginx-minnie.conf /etc/nginx/sites-available/minnie
sudo ln -s /etc/nginx/sites-available/minnie /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

sudo certbot --nginx -d minnie.yourdomain.com
```

---

## 8. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

Do **not** expose ports 3000 or 4000 publicly — Nginx proxies to localhost only.

---

## 9. Updates & restarts

```bash
cd /opt/minnie
git pull
npm run install:all
cd dashboard && npm run build && cd ..
npm run deploy-commands   # if essential-commands.js changed
sudo systemctl restart minnie-bot minnie-dashboard
```

---

## 10. Backups (important)

SQLite and logs live on the VM disk. Back up regularly:

```bash
# Example cron backup
tar -czf /backup/minnie-$(date +%F).tar.gz \
  /opt/minnie/data \
  /opt/minnie/logs \
  /opt/minnie/.env
```

---

## 11. Proxmox VM backups

In Proxmox: **Datacenter → Backup** → schedule VM snapshots to your NAS/storage. This protects the whole machine including Node, DB, and config.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| OAuth login fails | Redirect URI in Discord must match `OAUTH_REDIRECT_URI` exactly (HTTPS) |
| Dashboard loads, API 401 | Re-login; check `JWT_SECRET` unchanged |
| Bot offline | `journalctl -u minnie-bot -f`; check `DISCORD_TOKEN` and intents |
| `better-sqlite3` build error | `sudo apt install build-essential`; use Node 20 VM not minimal container |
| WebSocket not live | `NEXT_PUBLIC_WS_URL` must be your public HTTPS origin |

---

## Optional: LXC instead of VM

Possible on Proxmox LXC if you install `build-essential` and Node inside the container. VM is recommended for fewer permission issues with native npm modules and systemd.

---

## Proxmox web UI on a subdomain? (separate from Minnie)

If you also want `proxmox.yourdomain.com` for the Proxmox management UI, that is **a different service** on the Proxmox **host** (port 8006). Use another DNS record + reverse proxy on a separate machine or Nginx on the host — do not mix with the Minnie VM unless you know what you're doing. Minnie only needs `minnie.yourdomain.com`.
