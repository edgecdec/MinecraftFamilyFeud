#!/bin/bash
set -uo pipefail

APP_DIR="/var/www/MinecraftFamilyFeud"
LOG="/var/log/webhook_deploy_feud.log"
LOCK="/tmp/deploy_feud.lock"
PM2_NAME="minecraft-feud"

exec >> "$LOG" 2>&1
echo "=========================================="
echo "Deploy started: $(date)"

if [ -f "$LOCK" ]; then
  echo "Deploy already in progress, exiting."
  exit 0
fi
trap 'rm -f "$LOCK"' EXIT
touch "$LOCK"

cd "$APP_DIR"

OLD_PKG_HASH=$(md5sum package.json 2>/dev/null | cut -d' ' -f1 || echo "none")

git fetch origin main
git reset --hard origin/main

NEW_PKG_HASH=$(md5sum package.json | cut -d' ' -f1)

if [ "$OLD_PKG_HASH" != "$NEW_PKG_HASH" ]; then
  echo "package.json changed, running npm install..."
  npm install
fi

pm2 stop "$PM2_NAME" 2>/dev/null || true

rm -rf .next node_modules/.cache
if npm run build; then
  echo "Build succeeded, restarting..."
  pm2 restart "$PM2_NAME" || pm2 start server.js --name "$PM2_NAME"
  echo "Deploy finished: $(date)"
else
  echo "Build FAILED, restarting with old build..."
  pm2 restart "$PM2_NAME" || pm2 start server.js --name "$PM2_NAME"
  echo "Deploy failed: $(date)"
fi

echo "=========================================="
