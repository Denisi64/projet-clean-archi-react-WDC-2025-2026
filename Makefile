SHELL := /bin/bash
PRISMA := pnpm -w prisma

# Schémas (un par moteur)
SCHEMA_PG := prisma/schema.prisma
SCHEMA_MY := prisma/schema.maria.prisma

# URLs
POSTGRES_URL := postgresql://user:pass@localhost:5432/bank?schema=public
MARIADB_URL  := mysql://user:pass@localhost:3306/bank

# Dossiers migrations
MIGR_PG := prisma/migrations_pg
MIGR_MY := prisma/migrations_mysql
MIGR_LNK := prisma/migrations           # <- symlink géré automatiquement

.PHONY: \
  db-env-postgres db-env-mariadb db-lock-clean \
  migr-link-postgres migr-link-mariadb \
  db-reset-postgres db-reset-mariadb \
  db-init-postgres db-init-mariadb \
  db-deploy-postgres db-deploy-mariadb \
  db-push-postgres db-push-mariadb \
  db-seed-postgres db-seed-mariadb \
  db-studio-postgres db-studio-mariadb

# -------- env (.env Prisma) --------
db-env-postgres:
	@mkdir -p prisma
	@{ \
	  echo 'DATABASE_URL="$(POSTGRES_URL)"'; \
	  echo 'SHADOW_DATABASE_URL="postgresql://user:pass@localhost:5432/postgres?schema=public"'; \
	} > prisma/.env
	@echo "prisma/.env -> POSTGRES"

db-env-mariadb:
	@mkdir -p prisma
	@{ \
	  echo 'DATABASE_URL="$(MARIADB_URL)"'; \
	  echo 'SHADOW_DATABASE_URL="mysql://root:pass@localhost:3306/prisma_shadow"'; \
	} > prisma/.env
	@echo "prisma/.env -> MARIADB"

# -------- symlink des migrations --------
migr-link-postgres:
	@mkdir -p $(MIGR_PG)
	@rm -rf $(MIGR_LNK)
	@ln -s migrations_pg $(MIGR_LNK)
	@echo "migrations → migrations_pg"

migr-link-mariadb:
	@mkdir -p $(MIGR_MY)
	@rm -rf $(MIGR_LNK)
	@ln -s migrations_mysql $(MIGR_LNK)
	@echo "migrations → migrations_mysql"

# -------- lock clean (tous les emplacements) --------
db-lock-clean:
	@rm -f prisma/migration_lock.toml \
	       $(MIGR_PG)/migration_lock.toml \
	       $(MIGR_MY)/migration_lock.toml
	@echo "🧹 locks nettoyés (prisma/, migrations_pg/, migrations_mysql/)"

# -------- flows complets --------
db-reset-postgres: db-env-postgres migr-link-postgres db-lock-clean
	$(PRISMA) migrate reset  --schema="$(SCHEMA_PG)" --force --skip-seed
	$(PRISMA) migrate dev    --name init --schema="$(SCHEMA_PG)"
	$(PRISMA) migrate deploy --schema="$(SCHEMA_PG)"
	$(PRISMA) db seed        --schema="$(SCHEMA_PG)"
	@echo "✅ Postgres reset + init + deploy + seed OK."

db-reset-mariadb: db-env-mariadb migr-link-mariadb db-lock-clean
	@docker compose up -d mariadb >/dev/null 2>&1 || true
	# Shadow facultatif (si besoin)
	@docker compose exec -T mariadb sh -lc 'mariadb -uroot -ppass -e "CREATE DATABASE IF NOT EXISTS prisma_shadow;"' || true
	$(PRISMA) migrate reset  --schema="$(SCHEMA_MY)" --force --skip-seed
	$(PRISMA) migrate dev    --name init --schema="$(SCHEMA_MY)"
	$(PRISMA) migrate deploy --schema="$(SCHEMA_MY)"
	$(PRISMA) db seed        --schema="$(SCHEMA_MY)"
	@echo "✅ MariaDB reset + init + deploy + seed OK."

# -------- primitives (si besoin à part) --------
db-init-postgres: db-env-postgres migr-link-postgres db-lock-clean
	$(PRISMA) migrate dev --name init --schema="$(SCHEMA_PG)"

db-init-mariadb: db-env-mariadb migr-link-mariadb db-lock-clean
	$(PRISMA) migrate dev --name init --schema="$(SCHEMA_MY)"

db-deploy-postgres: db-env-postgres migr-link-postgres
	$(PRISMA) migrate deploy --schema="$(SCHEMA_PG)"

db-deploy-mariadb: db-env-mariadb migr-link-mariadb
	$(PRISMA) migrate deploy --schema="$(SCHEMA_MY)"

db-push-postgres: db-env-postgres migr-link-postgres db-lock-clean
	$(PRISMA) db push --force-reset --schema="$(SCHEMA_PG)"

db-push-mariadb: db-env-mariadb migr-link-mariadb db-lock-clean
	@docker compose up -d mariadb >/dev/null 2>&1 || true
	$(PRISMA) db push --force-reset --schema="$(SCHEMA_MY)"

db-seed-postgres: db-env-postgres migr-link-postgres
	$(PRISMA) db seed --schema="$(SCHEMA_PG)"

db-seed-mariadb: db-env-mariadb migr-link-mariadb
	$(PRISMA) db seed --schema="$(SCHEMA_MY)"

db-studio-postgres: db-env-postgres migr-link-postgres
	$(PRISMA) studio --schema="$(SCHEMA_PG)"

db-studio-mariadb: db-env-mariadb migr-link-mariadb
	$(PRISMA) studio --schema="$(SCHEMA_MY)"
