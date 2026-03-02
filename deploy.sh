#!/bin/zsh
cd "$(dirname "$0")"
git add .
MSG=${1:-"update: $(date '+%Y-%m-%d %H:%M')"}
git commit -m "$MSG"
git push
echo "✓ 배포 완료 → Vercel 자동 빌드 시작"
