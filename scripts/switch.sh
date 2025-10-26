#!/usr/bin/env bash
set -euo pipefail

BACKEND="${1:-nest}"     # nest | next
DB="${2:-pg}"            # pg | maria | memory

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

log() { echo -e "\033[1;36m[$(date +%H:%M:%S)]\033[0m $*"; }
warn(){ echo -e "\033[1;33m[warn]\033[0m $*"; }
err() { echo -e "\033[1;31m[ERR]\033[0m $*" >&2; }

# 0) Docker ok
unset DOCKER_HOST || true
docker context use default >/dev/null 2>&1 || true
if ! docker ps >/dev/null 2>&1; then
  log "Docker daemon: start… (sudo peut être requis)"
  sudo systemctl start docker
fi

# 1) Stop PM2 apps si tournent
log "Arrêt PM2 (api/web)…"
pnpm -w pm2 delete api >/dev/null 2>&1 || true
pnpm -w pm2 delete web >/dev/null 2>&1 || true

# 2) Switch DB (compose + .env API)
case "$DB" in
  pg|postgres)
    log "→ DB = Postgres"
    pnpm -w env:pg
    pnpm -w db:down || true
    pnpm -w db:pg
    DB_DRIVER="postgres"
    ;;
  maria|mariadb)
    log "→ DB = MariaDB"
    pnpm -w env:maria
    pnpm -w db:down || true
    pnpm -w db:maria
    DB_DRIVER="mariadb"
    ;;
  memory)
    log "→ DB = memory (pas de conteneur)"
    pnpm -w env:memory
    pnpm -w db:down || true
    DB_DRIVER="memory"
    ;;
  *)
    err "DB inconnue: $DB (attendu: pg|maria|memory)"; exit 2;;
esac

# 3) Backend + Prisma generate au bon endroit
case "$BACKEND" in
  nest)
    log "→ Backend = Nest (Next proxifie /api -> Nest)"

    # .env.local FRONT: BACKEND_TARGET=nest + nettoyage des variables DB
    WEB_ENV="apps/web-next/.env.local"
    mkdir -p "$(dirname "$WEB_ENV")"; touch "$WEB_ENV"
    if grep -q '^BACKEND_TARGET=' "$WEB_ENV"; then
      sed -i 's|^BACKEND_TARGET=.*|BACKEND_TARGET=nest|' "$WEB_ENV"
    else
      echo "BACKEND_TARGET=nest" >> "$WEB_ENV"
    fi
    if grep -q '^NEST_API_URL=' "$WEB_ENV"; then
      sed -i 's|^NEST_API_URL=.*|NEST_API_URL=http://localhost:3001|' "$WEB_ENV"
    else
      echo "NEST_API_URL=http://localhost:3001" >> "$WEB_ENV"
    fi
    # on retire DB_DRIVER/DATABASE_URL pour éviter que Next utilise Prisma en mode proxy
    sed -i '/^DB_DRIVER=/d;/^DATABASE_URL=/d' "$WEB_ENV" || true

    # Prisma côté API (sauf memory)
    if [[ "$DB_DRIVER" == "postgres" ]]; then
      log "Prisma API (provider=postgresql)…"
      make prisma-generate-pg-api
    elif [[ "$DB_DRIVER" == "mariadb" ]]; then
      log "Prisma API (provider=mysql)…"
      make prisma-generate-maria-api
    else
      warn "memory: pas de prisma generate"
    fi

    # 4) (Re)lance API + WEB sous PM2
    log "PM2 start api + web…"
    pnpm -w pm2 start ecosystem.config.cjs --only api,web >/dev/null
    ;;

  next)
    log "→ Backend = Next (routes API Next, pas de proxy)"

    # .env.local FRONT: BACKEND_TARGET=next + DB_DRIVER + DATABASE_URL
    WEB_ENV="apps/web-next/.env.local"
    mkdir -p "$(dirname "$WEB_ENV")"; touch "$WEB_ENV"
    if grep -q '^BACKEND_TARGET=' "$WEB_ENV"; then
      sed -i 's|^BACKEND_TARGET=.*|BACKEND_TARGET=next|' "$WEB_ENV"
    else
      echo "BACKEND_TARGET=next" >> "$WEB_ENV"
    fi

    case "$DB_DRIVER" in
      postgres)
        PG_URL="postgresql://user:pass@localhost:5432/bank?schema=public"
        if grep -q '^DB_DRIVER=' "$WEB_ENV"; then sed -i 's|^DB_DRIVER=.*|DB_DRIVER=postgres|' "$WEB_ENV"; else echo "DB_DRIVER=postgres" >> "$WEB_ENV"; fi
        if grep -q '^DATABASE_URL=' "$WEB_ENV"; then sed -i "s|^DATABASE_URL=.*|DATABASE_URL=$PG_URL|" "$WEB_ENV"; else echo "DATABASE_URL=$PG_URL" >> "$WEB_ENV"; fi
        log "Prisma WEB (provider=postgresql)…"
        make prisma-generate-pg-web
        ;;
      mariadb)
        MARIA_URL="mysql://user:pass@localhost:3306/bank"
        if grep -q '^DB_DRIVER=' "$WEB_ENV"; then sed -i 's|^DB_DRIVER=.*|DB_DRIVER=mariadb|' "$WEB_ENV"; else echo "DB_DRIVER=mariadb" >> "$WEB_ENV"; fi
        if grep -q '^DATABASE_URL=' "$WEB_ENV"; then sed -i "s|^DATABASE_URL=.*|DATABASE_URL=$MARIA_URL|" "$WEB_ENV"; else echo "DATABASE_URL=$MARIA_URL" >> "$WEB_ENV"; fi
        log "Prisma WEB (provider=mysql)…"
        make prisma-generate-maria-web
        ;;
      memory)
        if grep -q '^DB_DRIVER=' "$WEB_ENV"; then sed -i 's|^DB_DRIVER=.*|DB_DRIVER=memory|' "$WEB_ENV"; else echo "DB_DRIVER=memory" >> "$WEB_ENV"; fi
        sed -i '/^DATABASE_URL=/d' "$WEB_ENV" || true
        warn "memory: pas de prisma generate côté web"
        ;;
    esac

    # 4) (Re)lance uniquement le WEB (API inutile en mode next)
    log "PM2 start web…"
    pnpm -w pm2 start ecosystem.config.cjs --only web >/dev/null
    pnpm -w pm2 delete api >/dev/null 2>&1 || true
    ;;

  *)
    err "Backend inconnu: $BACKEND (attendu: nest|next)"; exit 2;;
esac

# 5) Health checks (best-effort)
sleep 0.8
if [[ "$BACKEND" == "nest" ]]; then
  log "Health API (Nest)…"
  curl -sf http://localhost:3001/health/db || true
  echo
fi

log "Health FRONT (Next)…"
curl -sf http://localhost:3000/api/health || true
echo

log "Done. Logs:  pnpm -w pm2 logs  | Liste: pnpm -w pm2 ls  | Stop: pnpm -w pm2 delete all"
