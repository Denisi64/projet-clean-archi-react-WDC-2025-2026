#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="/work"
SCHEMA="${PRISMA_SCHEMA:-prisma/schema.prisma}"
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"

wait_db() {
  for _ in $(seq 1 60); do
    if node -e "require('net').createConnection({host:'${DB_HOST}',port:${DB_PORT}},()=>process.exit(0)).on('error',()=>process.exit(1))" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  return 1
}

cd "$ROOT_DIR"

corepack enable >/dev/null 2>&1 || true
corepack prepare pnpm@10.18.1 --activate >/dev/null 2>&1 || true

if [[ ! -f node_modules/.pnpm/lock.yaml ]] || [[ pnpm-lock.yaml -nt node_modules/.pnpm/lock.yaml ]]; then
  pnpm config set ignore-scripts false >/dev/null 2>&1 || true
  pnpm install --frozen-lockfile
fi

wait_db

pnpm -w prisma generate --schema "$SCHEMA"

pnpm --filter @proj/domain --filter @proj/application --filter @proj/infra run build

pnpm -w prisma db push --accept-data-loss --schema "$SCHEMA"

pnpm -w prisma db seed --schema "$SCHEMA"

cd /work/apps/web-next
exec ./node_modules/.bin/next dev -p 3000 -H 0.0.0.0
