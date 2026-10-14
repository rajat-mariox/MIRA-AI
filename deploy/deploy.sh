#!/usr/bin/env bash
# Pull the latest code and rebuild/restart everything on the server.
#   cd ~/MIRA-AI && bash deploy/deploy.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> git pull"
git pull --ff-only

echo "==> Backend"
cd "$ROOT/mirai-backend"
npm ci
npm run build
if pm2 describe mirai-api >/dev/null 2>&1; then
  pm2 reload ecosystem.config.cjs --update-env
else
  pm2 start ecosystem.config.cjs
fi
pm2 save

echo "==> Admin panel"
cd "$ROOT/mirai-admin-panel"
npm ci
npm run build
sudo mkdir -p /var/www/mirai-admin
sudo rsync -a --delete dist/ /var/www/mirai-admin/

echo "==> Website"
cd "$ROOT/mirai-react"
npm ci
npm run build
sudo mkdir -p /var/www/mirai-site
sudo rsync -a --delete dist/ /var/www/mirai-site/

echo "==> Done"
curl -fsS http://127.0.0.1:5000/api/v1/health && echo
