# -------- Makefile --------
SHELL := /bin/bash
PRISMA := npx prisma
SCHEMA := prisma/schema.prisma

# URLs locales
POSTGRES_URL := postgresql://user:pass@localhost:5432/bank?schema=public
MYSQL_URL    := mysql://user:pass@localhost:3306/bank

# Dossiers migrations
MIGR_PG  := prisma/migrations_pg
MIGR_MY  := prisma/migrations_mysql

.PHONY: help \
        db-provider-postgres db-provider-mariadb \
        db-env-postgres db-env-mariadb db-lock-clean \
        db-generate db-reset db-init db-deploy db-push db-seed db-studio \
        db-reset-postgres db-reset-mariadb \
        db-studio-postgres db-studio-mariadb

help:
	@echo "Targets:"
	@echo "  make db-reset-postgres   -> provider=postgresql + .env + lock clean + reset/dev/deploy/seed (migrations_pg)"
	@echo "  make db-reset-mariadb    -> provider=mysql      + .env + lock clean + reset/dev/deploy/seed (migrations_mysql)"
	@echo "  make db-studio-postgres  -> Prisma Studio (Postgres)"
	@echo "  make db-studio-mariadb   -> Prisma Studio (MariaDB)"
	@echo "  make db-generate         -> prisma generate"
	@echo "  make db-seed             -> prisma db seed"
	@echo "  make db-push             -> prisma db push"
	@echo "  make db-deploy           -> prisma migrate deploy"
	@echo "  make db-init             -> prisma migrate dev --name init"
	@echo "  make db-reset            -> prisma migrate reset --skip-seed --force"
	@echo "  make db-lock-clean       -> supprime prisma/migration_lock.toml (utile lors d'un switch de provider)"

# --- Switch provider dans prisma/schema.prisma
db-provider-postgres:
	@sed -i -E 's/provider *= *"mysql"/provider = "postgresql"/' $(SCHEMA) || true
	@grep -q 'provider *= *"postgresql"' $(SCHEMA) || (echo "ERREUR: provider non mis à jour"; exit 1)

db-provider-mariadb:
	@sed -i -E 's/provider *= *"postgresql"/provider = "mysql"/' $(SCHEMA) || true
	@grep -q 'provider *= *"mysql"' $(SCHEMA) || (echo "ERREUR: provider non mis à jour"; exit 1)



.PHONY: db-shadow-mariadb
db-shadow-mariadb:
	@docker compose up -d mariadb
	@docker exec -it projet-clean-archi-react-wdc-2025-2026-mariadb-1 sh -lc \
	  'mariadb -uroot -p"$$MARIADB_ROOT_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS prisma_shadow;"'
	@echo "✓ shadow DB prisma_shadow OK"

# --- Ecrit prisma/.env
db-env-postgres:
	@mkdir -p prisma
	@{ \
	  echo 'DATABASE_URL="postgresql://user:pass@localhost:5432/bank?schema=public"'; \
	  echo 'SHADOW_DATABASE_URL="postgresql://user:pass@localhost:5432/postgres?schema=public"'; \
	} > prisma/.env
	@echo "prisma/.env -> POSTGRES (+ shadow)"

db-env-mariadb:
	@mkdir -p prisma
	@{ \
	  echo 'DATABASE_URL="mysql://user:pass@localhost:3306/bank"'; \
	  echo 'SHADOW_DATABASE_URL="mysql://root:pass@localhost:3306/prisma_shadow"'; \
	} > prisma/.env
	@echo "prisma/.env -> MARIADB (+ shadow prisma_shadow)"

# --- Lock clean (évite P3019 lors d'un switch de provider)
db-lock-clean:
	@rm -f prisma/migration_lock.toml
	@echo "🧹 prisma/migration_lock.toml supprimé."

# --- Primitives Prisma (paramétrées par PRISMA_MIGRATIONS_DIR)
db-generate:
	@$(PRISMA) generate --schema=$(SCHEMA)

db-reset:
	@$(PRISMA) migrate reset --schema=$(SCHEMA) --force --skip-seed

db-init:
	@$(PRISMA) migrate dev --name init --schema=$(SCHEMA)

db-deploy:
	@$(PRISMA) migrate deploy --schema=$(SCHEMA)

db-push:
	@$(PRISMA) db push --schema=$(SCHEMA)

db-seed:
	@$(PRISMA) db seed --schema=$(SCHEMA)

db-studio:
	@$(PRISMA) studio --schema=$(SCHEMA)

# --- Flows complets (on fixe PRISMA_MIGRATIONS_DIR à chaque étape)
db-reset-postgres: db-provider-postgres db-env-postgres db-lock-clean
	@mkdir -p $(MIGR_PG)
	@PRISMA_MIGRATIONS_DIR=$(MIGR_PG) $(PRISMA) migrate reset  --schema=$(SCHEMA) --force --skip-seed
	@PRISMA_MIGRATIONS_DIR=$(MIGR_PG) $(PRISMA) migrate dev    --name init --schema=$(SCHEMA)
	@PRISMA_MIGRATIONS_DIR=$(MIGR_PG) $(PRISMA) migrate deploy --schema=$(SCHEMA)
	@PRISMA_MIGRATIONS_DIR=$(MIGR_PG) $(PRISMA) db seed        --schema=$(SCHEMA)
	@echo "✅ Postgres reset + init + deploy + seed OK."

db-reset-mariadb: db-provider-mariadb db-env-mariadb db-lock-clean db-shadow-mariadb
	@mkdir -p $(MIGR_MY)
	@PRISMA_MIGRATIONS_DIR=$(MIGR_MY) $(PRISMA) migrate reset  --schema=$(SCHEMA) --force --skip-seed
	@PRISMA_MIGRATIONS_DIR=$(MIGR_MY) $(PRISMA) migrate dev    --name init --schema=$(SCHEMA)
	@PRISMA_MIGRATIONS_DIR=$(MIGR_MY) $(PRISMA) migrate deploy --schema=$(SCHEMA)
	@PRISMA_MIGRATIONS_DIR=$(MIGR_MY) $(PRISMA) db seed        --schema=$(SCHEMA)
	@echo "✅ MariaDB reset + init + deploy + seed OK."

# --- Studio avec contexte correct
db-studio-postgres: db-provider-postgres db-env-postgres
	@PRISMA_MIGRATIONS_DIR=$(MIGR_PG) $(PRISMA) studio --schema=$(SCHEMA)

db-studio-mariadb: db-provider-mariadb db-env-mariadb
	@PRISMA_MIGRATIONS_DIR=$(MIGR_MY) $(PRISMA) studio --schema=$(SCHEMA)
# -------- fin Makefile --------
