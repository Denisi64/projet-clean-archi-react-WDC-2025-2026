# =========================
# Makefile — Switch Backend & DB (monorepo pnpm)
# =========================
SHELL := /bin/bash

# Ports
API_PORT ?= 3001
WEB_PORT ?= 3000

# DB URLs (une seule source de vérité)
PG_URL    ?= postgresql://user:pass@localhost:5432/bank?schema=public
MARIA_URL ?= mysql://user:pass@localhost:3306/bank

# Fichiers env
WEB_ENV := apps/web-next/.env.local

# ---------------- Help ----------------
.PHONY: help
help:
	@echo "✨ Combos (backend + DB) :"
	@echo "  make run-nest-pg        # Nest + Postgres (Prisma côté API)"
	@echo "  make run-nest-maria     # Nest + MariaDB (Prisma côté API)"
	@echo "  make run-next-pg        # Next API + Postgres (Prisma côté Next)"
	@echo "  make run-next-maria     # Next API + MariaDB (Prisma côté Next)"
	@echo ""
	@echo "⚙️  Unités :"
	@echo "  make backend-next | backend-nest | backend-toggle"
	@echo "  make up-pg | up-maria | up-memory | db-down"
	@echo "  make prisma-generate-pg-api     # Prisma (pg)   dans api-nest"
	@echo "  make prisma-generate-maria-api  # Prisma (mysql) dans api-nest"
	@echo "  make prisma-generate-pg-web     # Prisma (pg)   dans web-next"
	@echo "  make prisma-generate-maria-web  # Prisma (mysql) dans web-next"
	@echo "  make api | web | health-api | health-front | fix-docker | approve-builds"

# ==========================================================
# Helpers .env du front (Next)
# ==========================================================
$(WEB_ENV):
	@mkdir -p $(dir $@)
	@touch $@

define set_front_env
	@grep -q '^$(1)=' $(WEB_ENV) \
		&& sed -i 's|^$(1)=.*|$(1)=$(2)|' $(WEB_ENV) \
		|| echo '$(1)=$(2)' >> $(WEB_ENV)
endef

# ==========================================================
# Backend switch (Next <-> Nest via proxy)
# ==========================================================
.PHONY: backend-next backend-nest backend-toggle
backend-next: $(WEB_ENV)
	$(call set_front_env,BACKEND_TARGET,next)
	@echo "✅ BACKEND_TARGET=next — routes Next actives. Relance: make web"

backend-nest: $(WEB_ENV)
	$(call set_front_env,BACKEND_TARGET,nest)
	$(call set_front_env,NEST_API_URL,http://localhost:$(API_PORT))
	@echo "✅ BACKEND_TARGET=nest — proxy Next -> Nest ($(API_PORT)). Relance: make web"

backend-toggle: $(WEB_ENV)
	@if grep -q '^BACKEND_TARGET=next' $(WEB_ENV); then \
		$(MAKE) backend-nest; \
	else \
		$(MAKE) backend-next; \
	fi

# Quand BACKEND_TARGET=next, le front peut parler à la DB (Prisma côté Next)
.PHONY: front-db-pg front-db-maria front-db-memory
front-db-pg: $(WEB_ENV)
	$(call set_front_env,DB_DRIVER,postgres)
	$(call set_front_env,DATABASE_URL,$(PG_URL))
front-db-maria: $(WEB_ENV)
	$(call set_front_env,DB_DRIVER,mariadb)
	$(call set_front_env,DATABASE_URL,$(MARIA_URL))
front-db-memory: $(WEB_ENV)
	$(call set_front_env,DB_DRIVER,memory)
	@sed -i '/^DATABASE_URL=/d' $(WEB_ENV) || true

# ==========================================================
# DB switch (docker + .env API via scripts PNPM existants)
# ==========================================================
.PHONY: env-pg env-maria env-memory db-pg db-maria db-down up-pg up-maria up-memory
env-pg:     ; pnpm -w env:pg
env-maria:  ; pnpm -w env:maria
env-memory: ; pnpm -w env:memory

db-pg:
	pnpm -w db:down || true
	pnpm -w db:pg

db-maria:
	pnpm -w db:down || true
	pnpm -w db:maria

db-down:
	pnpm -w db:down || true

up-pg: env-pg db-pg
	@echo "DB_DRIVER=postgres"

up-maria: env-maria db-maria
	@echo "DB_DRIVER=mariadb"

up-memory: env-memory db-down
	@echo "DB_DRIVER=memory"

# ==========================================================
# Prisma generate (API Nest / Web Next)
# ==========================================================
.PHONY: prisma-generate-pg-api prisma-generate-maria-api prisma-generate-pg-web prisma-generate-maria-web approve-builds
prisma-generate-pg-api:
	cd apps/api-nest && \
	DATABASE_URL="$(PG_URL)" \
	pnpm prisma generate --schema ../../prisma/schema.prisma

prisma-generate-maria-api:
	cd apps/api-nest && \
	DATABASE_URL="$(MARIA_URL)" \
	pnpm prisma generate --schema ../../prisma/schema.maria.prisma

prisma-generate-pg-web:
	cd apps/web-next && \
	DATABASE_URL="$(PG_URL)" \
	pnpm prisma generate --schema ../../prisma/schema.prisma

prisma-generate-maria-web:
	cd apps/web-next && \
	DATABASE_URL="$(MARIA_URL)" \
	pnpm prisma generate --schema ../../prisma/schema.maria.prisma

approve-builds:
	pnpm approve-builds || true

# ==========================================================
# Lancement apps
# ==========================================================
.PHONY: api web
api:
	pnpm --filter api-nest dev
web:
	pnpm --filter web-next dev

# ==========================================================
# Health & utilitaires
# ==========================================================
.PHONY: health-api health-front ps logs fix-docker
health-api:
	@curl -s http://localhost:$(API_PORT)/health/db | jq . || curl -s http://localhost:$(API_PORT)/health/db
health-front:
	@curl -s http://localhost:$(WEB_PORT)/api/health | jq . || curl -s http://localhost:$(WEB_PORT)/api/health
ps:
	docker ps
logs:
	-@docker logs -n 50 projet-clean-archi-react-wdc-2025-2026-postgres-1 2>/dev/null || true
	-@docker logs -n 50 projet-clean-archi-react-wdc-2025-2026-mariadb-1 2>/dev/null || true
fix-docker:
	@/bin/bash -lc 'unset DOCKER_HOST; docker context use default || true; sudo systemctl start docker; docker ps'

# ==========================================================
# COMBOS (tout prêt)
# ==========================================================
# Nest + Postgres : API parle à PG ; Front proxifie
.PHONY: run-nest-pg run-nest-maria run-next-pg run-next-maria
run-nest-pg: backend-nest up-pg prisma-generate-pg-api
	@echo "➡️  Ensuite : Terminal A: make api | Terminal B: make web"

# Nest + Maria : API parle à Maria ; Front proxifie
run-nest-maria: backend-nest up-maria prisma-generate-maria-api
	@echo "➡️  Ensuite : Terminal A: make api | Terminal B: make web"

# Next API + Postgres : Next parle DIRECT à PG
run-next-pg: backend-next front-db-pg up-pg prisma-generate-pg-web
	@echo "➡️  Ensuite : Terminal A: make web"

# Next API + Maria : Next parle DIRECT à Maria
run-next-maria: backend-next front-db-maria up-maria prisma-generate-maria-web
	@echo "➡️  Ensuite : Terminal A: make web"

# Nécessite: pnpm -w add -D concurrently
start-nest-pg-all: backend-nest up-pg prisma-generate-pg-api
	pnpm -w concurrently -n "API,WEB" -c "blue,green" \
	"pnpm --filter api-nest dev" \
	"pnpm --filter web-next dev"

start-nest-maria-all: backend-nest up-maria prisma-generate-maria-api
	pnpm -w concurrently -n "API,WEB" -c "blue,green" \
	"pnpm --filter api-nest dev" \
	"pnpm --filter web-next dev"

start-next-pg-all: backend-next front-db-pg up-pg prisma-generate-pg-web
	pnpm -w concurrently -n "WEB" -c "green" \
	"pnpm --filter web-next dev"

start-next-maria-all: backend-next front-db-maria up-maria prisma-generate-maria-web
	pnpm -w concurrently -n "WEB" -c "green" \
	"pnpm --filter web-next dev"

.PHONY: switch
# usage: make switch BACKEND=nest DB=pg   (ou BACKEND=next DB=maria/memory)
switch:
	./scripts/switch.sh "$(BACKEND)" "$(DB)"

# alias pratiques
run-nest-pg:     ; ./scripts/switch.sh nest pg
run-nest-maria:  ; ./scripts/switch.sh nest maria
run-nest-memory: ; ./scripts/switch.sh nest memory
run-next-pg:     ; ./scripts/switch.sh next pg
run-next-maria:  ; ./scripts/switch.sh next maria
run-next-memory: ; ./scripts/switch.sh next memory

