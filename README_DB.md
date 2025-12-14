# 🧭 Guide Projet — Init, Bases de données & Commandes (Postgres ↔ MariaDB)

Ce document résume **l’installation**, le **setup BDD**, les **commandes Makefile** et le **script dev** pour lancer la stack rapidement en local.

---

## ✅ Prérequis

- **Docker** (daemon système actif)
  ```bash
  sudo systemctl enable --now docker
  # (recommandé) socket système par défaut
  echo 'export DOCKER_HOST=unix:///var/run/docker.sock' >> ~/.bashrc && source ~/.bashrc
  ```
- **Node 18+**, `npx` (ou pnpm/yarn)
- **git**, **tmux**

---

## 📁 Arbo & fichiers importants

```
projet-clean-archi-react-WDC-2025-2026/
├── apps/
│   ├── api-nest/          # backend NestJS
│   └── web-next/          # frontend Next.js
├── prisma/
│   ├── schema.prisma
│   ├── migrations_pg/     # migrations Postgres
│   ├── migrations_mysql/  # migrations MariaDB
│   ├── seed.js            # fixtures (idempotent recommandé)
│   ├── seed.dev.ts        # fixtures de démo (users client/advisor)
│   └── .env               # généré (NE PAS COMMIT)
├── scripts/
│   └── dev                # start/stop/switch stack
├── docker-compose.yml
├── Makefile
└── README.md
```

> Prisma lit les env via `prisma.config.ts`. On **switch** de SGBD via le **Makefile** et `./scripts/dev`.

---

## 🚀 Première installation (au choix)

### Option A — PostgreSQL
```bash
make db-reset-postgres        # reset + migrations_pg + deploy + seed
./scripts/dev up nest postgres
# API → http://localhost:3001/health/db
# WEB → http://localhost:3000
```

### Option B — MariaDB
> Prisma a besoin d’une **shadow DB** dédiée (`prisma_shadow`). Le Makefile la crée automatiquement.

```bash
make db-reset-mariadb         # reset + migrations_mysql + deploy + seed (+ shadow auto)
./scripts/dev up nest mariadb
```

---

## 🔁 Basculer de BDD (switch Postgres ↔ MariaDB)

- Vers **MariaDB**
  ```bash
  make db-reset-mariadb
  ./scripts/dev up nest mariadb
  ```

- Vers **Postgres**
  ```bash
  make db-reset-postgres
  ./scripts/dev up nest postgres
  ```

> Ces commandes : mettent le bon `provider` dans `schema.prisma`, écrivent `prisma/.env` (incluant **SHADOW_DATABASE_URL** adapté), **reset** la base, **appliquent/créent** les migrations dans le bon dossier, puis **seed**.

---

## 🛠️ Modifier le schéma & les fixtures

1) Éditer `prisma/schema.prisma`
2) Mettre à jour `prisma/seed.js` (idempotent avec `upsert` de préférence)
3) Recréer proprement :
   ```bash
   make db-reset-postgres    # ou
   make db-reset-mariadb
   ```

> Si le schéma a changé, une **nouvelle migration** est générée et appliquée, puis seed relancé.

### Repartir à zéro côté migrations (local only)
- **Postgres**
  ```bash
  rm -rf prisma/migrations_pg
  make db-reset-postgres
  ```
- **MariaDB**
  ```bash
  rm -rf prisma/migrations_mysql
  make db-reset-mariadb
  ```

---

## 🧰 Commandes Makefile (extrait utile)

```bash
# Reset complet + migrations + seed
make db-reset-postgres
make db-reset-mariadb

# Prisma Studio
make db-studio-postgres
make db-studio-mariadb

# Primitives (si besoin)
make db-generate    # prisma generate
make db-init        # prisma migrate dev --name init (crée migration)
make db-deploy      # prisma migrate deploy
make db-push        # prisma db push (fallback)
make db-seed        # prisma db seed
make db-lock-clean  # supprime prisma/migration_lock.toml (switch provider)
```

> Les migrations sont lues depuis `PRISMA_MIGRATIONS_DIR` (dirigé par Make/script) :
> - Postgres → `prisma/migrations_pg`
> - MariaDB  → `prisma/migrations_mysql`

---

## 🖥️ Script dev : lancer la stack

```bash
./scripts/dev up nest postgres   # ou mariadb | memory
./scripts/dev stop               # stoppe tmux (API/WEB)
./scripts/dev down               # stop + docker compose down
./scripts/dev attach             # se rattacher à la session tmux
```

- **Pane API (Nest)** : exports `PORT`, `DB_DRIVER`, `DATABASE_URL`, `PRISMA_MIGRATIONS_DIR`, `SHADOW_DATABASE_URL`
- **Pane WEB (Next)** : exports `BACKEND_TARGET`, `NEST_API_URL`

---

## 👀 Prisma Studio

```bash
make db-studio-postgres   # http://localhost:5555
make db-studio-mariadb
```

---

## 🧪 Vérifications rapides

```bash
# Provider actif dans le datamodel
grep -n 'provider' prisma/schema.prisma

# URLs réellement utilisées
cat prisma/.env

# Migrations présentes
ls -1 prisma/migrations_pg
ls -1 prisma/migrations_mysql

# Santé à chaud
curl -s http://localhost:3001/health/db
```

---

## 🧯 Dépannage (FAQ express)

- **P1001: Can't reach database server**  
  DB non démarrée → `docker compose up -d postgres|mariadb` ou relancer `./scripts/dev up ...`

- **P3019: provider mismatch (mysql vs postgresql)**  
  Lock ancien → `make db-lock-clean` puis `make db-reset-*`

- **P3004: The 'mysql' database is a system database**  
  Mauvaise shadow DB → utiliser `.../prisma_shadow` (pas `.../mysql`)

- **P3014: could not create the shadow database**  
  Droits insuffisants → shadow en `root` (`mysql://root:pass@.../prisma_shadow`) ou `GRANT ALL`

- **P1012: shadowDatabaseUrl invalide**  
  En Postgres, la shadow doit commencer par `postgresql://...` (et pas `mysql://...`)

- **“No migration found in prisma/migrations”**  
  Si commande Prisma manuelle, fournir `PRISMA_MIGRATIONS_DIR` :
  ```bash
  # Postgres
  export PRISMA_MIGRATIONS_DIR=prisma/migrations_pg
  # MariaDB
  export PRISMA_MIGRATIONS_DIR=prisma/migrations_mysql
  ```

---

## 🔒 Bonnes pratiques

- Ne **jamais** committer :
  ```
  prisma/.env
  ```
- Seed **idempotent** (upsert) pour rejouer sans doublons.
- Éviter des types trop spécifiques à un seul SGBD si on veut garder le **switch cross-DB**.

---

## 📦 Mise à jour Prisma (optionnel)

```bash
npm i --save-dev prisma@latest
npm i @prisma/client@latest
```

---

## 🧩 TL;DR

- `make db-reset-postgres` / `make db-reset-mariadb` → **reset + migrations + seed**
- `./scripts/dev up nest <postgres|mariadb>` → **stack prête**
- Modifie ton schéma/seed → rejoue `make db-reset-*` et c’est clean 💪
