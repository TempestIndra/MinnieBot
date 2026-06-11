#!/usr/bin/env bash
# Run on the VM as your deploy user (e.g. nick): bash /opt/minnie/scripts/deploy.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/minnie}"
SERVICE_USER="${SERVICE_USER:-minnie}"

cd "$APP_DIR"

echo "==> Pull latest"
git -c safe.directory="$APP_DIR" pull

echo "==> Install dependencies (if needed)"
npm install --omit=dev
(cd dashboard && npm install --omit=dev)

echo "==> Build dashboard (remove old .next to avoid permission errors)"
sudo rm -rf "$APP_DIR/dashboard/.next"
(cd dashboard && npm run build)
sudo chown -R "$SERVICE_USER:$SERVICE_USER" "$APP_DIR/dashboard/.next"

echo "==> Restart services"
sudo systemctl restart minnie-bot minnie-dashboard

echo "==> Status"
sudo systemctl --no-pager status minnie-bot minnie-dashboard

echo "Done."
