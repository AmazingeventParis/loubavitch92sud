#!/bin/bash
# Deploy script: syncs articles from server before push (prevents data loss)
# Usage: bash deploy.sh "commit message"

set -e
cd "$(dirname "$0")"

MSG="${1:-Update}"

echo "1. Syncing articles from server..."
curl -s "https://loubavitch92sud.swipego.app/api/articles/all" \
  -H "x-admin-password: Laurytal2!" > data/articles.json 2>/dev/null || echo "[]" > data/articles.json
echo "   $(cat data/articles.json | grep -o '"id"' | wc -l) articles synced"

echo "2. Syncing uploaded images..."
# List images referenced in articles and download missing ones
mkdir -p uploads
for img in $(grep -oE '/uploads/[^"]+' data/articles.json 2>/dev/null); do
  fname=$(basename "$img")
  if [ ! -f "uploads/$fname" ]; then
    curl -s "https://loubavitch92sud.swipego.app$img" -o "uploads/$fname" 2>/dev/null && echo "   Downloaded $fname"
  fi
done

echo "3. Committing..."
git add -A
git commit -m "$MSG" || echo "   Nothing to commit"

echo "4. Pushing..."
git push

echo "5. Deploying to Coolify..."
curl -s "http://217.182.89.133:8000/api/v1/deploy?uuid=w110gndaxtlmoh0yd6n0ln5p&force=true" \
  -H "Authorization: Bearer 1|FNcssp3CipkrPNVSQyv3IboYwGsP8sjPskoBG3ux98e5a576"

echo ""
echo "Deploy queued! Wait ~90s then check https://loubavitch92sud.swipego.app"
