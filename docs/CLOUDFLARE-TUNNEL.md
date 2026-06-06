# Cloudflare Tunnel for Minnie (Ubuntu VM)

A Cloudflare Tunnel exposes `https://minnie.yourdomain.com` to your VM **without** opening ports 80/443 on your router. Cloudflare handles HTTPS at the edge.

## Prerequisites

1. A domain added to **Cloudflare** (nameservers pointed to Cloudflare)
2. Minnie running on the VM (`minnie-bot` + `minnie-dashboard` systemd services)
3. SSH access to the Ubuntu VM

---

## Step 1 — Install `cloudflared` on the VM

```bash
# Ubuntu/Debian (64-bit)
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared jammy main" | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update && sudo apt install -y cloudflared

cloudflared --version
```

If the repo fails on your Ubuntu version, use the direct binary:

```bash
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

---

## Step 2 — Log in to Cloudflare

```bash
sudo cloudflared tunnel login
```

A URL prints in the terminal. Open it in your browser, pick your domain, and authorize.

Credentials save to: `/root/.cloudflared/cert.pem` (if run as root) or `~/.cloudflared/cert.pem`

**Recommended:** run tunnel setup as the same user that owns Minnie, or copy certs to `/etc/cloudflared/` later.

---

## Step 3 — Create the tunnel

```bash
sudo mkdir -p /etc/cloudflared
sudo cloudflared tunnel create minnie
```

Note the **Tunnel ID** (UUID) from the output.

This creates `/root/.cloudflared/<TUNNEL-ID>.json` — copy it to `/etc/cloudflared/`:

```bash
sudo cp /root/.cloudflared/<TUNNEL-ID>.json /etc/cloudflared/credentials.json
sudo chmod 600 /etc/cloudflared/credentials.json
```

---

## Step 4 — Config file

Copy from the repo and edit:

```bash
sudo cp /opt/minnie/deploy/cloudflared-config.yml /etc/cloudflared/config.yml
sudo nano /etc/cloudflared/config.yml
```

Replace:

- `<TUNNEL-ID>` → your tunnel UUID
- `minnie.yourdomain.com` → your real subdomain

Example `config.yml`:

```yaml
tunnel: minnie
credentials-file: /etc/cloudflared/credentials.json

ingress:
  # Socket.io (live updates) — optional
  - hostname: minnie.yourdomain.com
    path: /socket.io/*
    service: http://127.0.0.1:4000
  # Next.js dashboard (proxies /api to Express)
  - hostname: minnie.yourdomain.com
    service: http://127.0.0.1:3000
  - service: http_status:404
```

Test the config:

```bash
sudo cloudflared tunnel --config /etc/cloudflared/config.yml ingress validate
```

---

## Step 5 — DNS route (creates CNAME automatically)

```bash
sudo cloudflared tunnel route dns minnie minnie.yourdomain.com
```

In Cloudflare DNS you should see a CNAME:

`minnie` → `<tunnel-id>.cfargotunnel.com` (proxied)

**Do not** also add an A record for the same name — remove conflicting records.

---

## Step 6 — Run as a systemd service

`--config` is a **global** flag — it must come **before** `service install` (not after).

If `config.yml` is already at `/etc/cloudflared/config.yml`:

```bash
sudo cloudflared service install
```

If the installer cannot find your config (e.g. it lives under `/home/nick/.cloudflared/`):

```bash
sudo cloudflared --config /etc/cloudflared/config.yml service install
```

The install command creates `/etc/systemd/system/cloudflared.service`. Then:

```bash
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
sudo systemctl status cloudflared
```

Logs:

```bash
sudo journalctl -u cloudflared -f
```

---

## Step 7 — Update Minnie `.env`

Edit `/opt/minnie/.env`:

```env
NODE_ENV=production
DASHBOARD_URL=https://minnie.yourdomain.com
OAUTH_REDIRECT_URI=https://minnie.yourdomain.com/auth/discord/callback
NEXT_PUBLIC_WS_URL=https://minnie.yourdomain.com
API_BACKEND_URL=http://127.0.0.1:4000
```

**Discord Developer Portal** → OAuth2 → Redirects:

```
https://minnie.yourdomain.com/auth/discord/callback
```

Rebuild dashboard (URLs are baked in at build time for some vars):

```bash
cd /opt/minnie/dashboard && npm run build && cd ..
sudo systemctl restart minnie-bot minnie-dashboard
```

---

## Step 8 — You do NOT need Nginx (with tunnel)

When using Cloudflare Tunnel only:

- Skip Nginx + Certbot from the main deploy guide
- Firewall: only allow SSH — **no** need to open 80/443

```bash
sudo ufw allow OpenSSH
sudo ufw enable
```

---

## Step 9 — Verify

1. `https://minnie.yourdomain.com` — dashboard loads
2. Login with Discord — OAuth succeeds
3. Bot still online (`systemctl status minnie-bot`)
4. `/dashboard` slash command link works

---

## Alternative: configure in Cloudflare Dashboard (no YAML)

1. Go to [Cloudflare Zero Trust](https://one.dash.cloudflare.com/)
2. **Networks** → **Tunnels** → your tunnel → **Public Hostname**
3. Add hostname:
   - Subdomain: `minnie`
   - Domain: `yourdomain.com`
   - Type: HTTP
   - URL: `localhost:3000`
4. Add another public hostname rule for path `/socket.io/*` → `localhost:4000` (if using live updates)

YAML + systemd is better for reproducible server setup.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| 502 Bad Gateway | Dashboard not running: `systemctl status minnie-dashboard` |
| OAuth redirect error | `OAUTH_REDIRECT_URI` must match Discord portal exactly (https) |
| Tunnel not connecting | `journalctl -u cloudflared -f`; check credentials.json path |
| DNS not resolving | `cloudflared tunnel route dns` again; remove duplicate A records |
| WebSocket dead | Add `/socket.io/*` ingress to port 4000 in config.yml |

---

## Security notes

- Tunnel outbound-only — no inbound holes in your router
- Restrict SSH to your IP in Cloudflare or use Tailscale for admin access
- Keep `.env` secrets out of git
