# ⚙️ Base de données — Setup & Workflow (Postgres ↔ MariaDB)

Ce projet supporte **deux SGBD** en développement : **PostgreSQL** et **MariaDB/MySQL**.  
On garde **un seul `schema.prisma`**, mais **deux répertoires de migrations** :

- `prisma/migrations_pg` (PostgreSQL)
- `prisma/migrations_mysql` (MariaDB)

Le choix du SGBD se fait via le **Makefile** et le script `./scripts/dev`.

---

## ✅ Prérequis

- Docker (daemon système activé)
  ```bash
  sudo systemctl enable --now docker
  sudo usermod -aG docker "$USER"   # puis déconnexion/reconnexion
  ```
- Node 18+ et pnpm/npx (ou npm/yarn)
- `git`, `tmux` (optionnel mais conseillé)

---

## 📁 Fichiers importants

| Fichier / Dossier | Rôle |
|--------------------|------|
| `prisma/schema.prisma` | Modèles Prisma communs |
| `prisma/migrations_pg/` | Historique des migrations Postgres |
| `prisma/migrations_mysql/` | Historique des migrations MariaDB |
| `prisma/.env` | Généré automatiquement (ne pas committer) |
| `prisma.config.ts` | Configuration Prisma globale |
| `prisma/seed.js` | Fixtures (jeux de données initiaux) |
| `./scripts/dev` | Script principal pour lancer API + Web + DB |

---

## 🚀 Démarrage rapide (première installation)

### Option A — PostgreSQL
```bash
make db-reset-postgres
./scripts/dev up nest postgres
# API   → http://localhost:3001/health/db
# WEB   → http://localhost:3000
```

### Option B — MariaDB
> Prisma utilise une **shadow DB** dédiée : `prisma_shadow`.

```bash
# (one-shot) création de la shadow DB root
docker compose up -d mariadb
docker exec -it projet-clean-archi-react-wdc-2025-2026-mariadb-1 sh -lc   'mariadb -uroot -p"$MARIADB_ROOT_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS prisma_shadow;"'

make db-reset-mariadb
./scripts/dev up nest mariadb
```

---

## 🔁 Switch instantané Postgres ↔ MariaDB

- **Basculer vers MariaDB**
  ```bash
  make db-reset-mariadb
  ./scripts/dev up nest mariadb
  ```

- **Basculer vers Postgres**
  ```bash
  make db-reset-postgres
  ./scripts/dev up nest postgres
  ```

> Les commandes `db-reset-*` :
> - ajustent le `provider` (`postgresql` / `mysql`)
> - mettent à jour `prisma/.env` (et la shadow DB côté MariaDB)
> - **reset** la base cible
> - **recréent les migrations**
> - **déploient** et **seed** automatiquement

---

## 🛠️ Modifier le schéma ou les fixtures

1. Éditer `prisma/schema.prisma` (ajouter/modifier des modèles ou relations)
2. Mettre à jour `prisma/seed.js` si besoin
3. Recréer une base propre :
   ```bash
   make db-reset-postgres    # ou
   make db-reset-mariadb
   ```

> Ces commandes créent une nouvelle migration si le schéma a changé, la déploient et rejouent le seed.

### Repartir complètement à zéro

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

## 👀 Prisma Studio

- **Postgres**
  ```bash
  make db-studio-postgres
  ```

- **MariaDB**
  ```bash
  make db-studio-mariadb
  ```

---

## 🧪 Vérifications rapides

```bash
# Provider actif
grep -n 'provider' prisma/schema.prisma

# URLs de connexion
cat prisma/.env

# Migrations présentes
ls -1 prisma/migrations_pg
ls -1 prisma/migrations_mysql

# Santé des services
curl -s http://localhost:3001/health/db
curl -s http://localhost:3000/api/health
```

---

## 🧯 Dépannage

### `P1001: Can't reach database server`
La base n’est pas démarrée →  
`docker compose up -d postgres|mariadb` puis relance `make db-reset-*`.

### `P3019: provider mismatch`
Tu as changé de SGBD →  
`make db-lock-clean` (supprime `prisma/migration_lock.toml`).

### `P3004: The 'mysql' database is a system database`
Ta shadow DB pointe vers `mysql`.  
→ Mets `SHADOW_DATABASE_URL="mysql://root:pass@localhost:3306/prisma_shadow"`.

### `P3014: could not create the shadow database`
L’utilisateur n’a pas le droit `CREATE DATABASE`.  
→ Utilise `root` pour la shadow DB ou `GRANT ALL`.

### “No migration found in prisma/migrations”
Si tu lances Prisma manuellement, pense à exporter :
```bash
# Postgres
export PRISMA_MIGRATIONS_DIR=prisma/migrations_pg

# MariaDB
export PRISMA_MIGRATIONS_DIR=prisma/migrations_mysql
```

---

## 🔒 Bonnes pratiques

- Ne jamais committer :
  ```
  prisma/.env
  ```
- Fixtures idempotentes (`upsert`) → rejouables sans doublons
- Éviter les types spécifiques à un seul SGBD (`@db.Citext`, etc.)

---

## 📚 Commandes utiles

```bash
# Reset + migrations + seed
make db-reset-postgres
make db-reset-mariadb

# Prisma Studio
make db-studio-postgres
make db-studio-mariadb

# Lancer la stack
./scripts/dev up nest postgres
./scripts/dev up nest mariadb

# Stop / down
./scripts/dev stop
./scripts/dev down
```

---

## 🧱 Structure technique

```
projet-clean-archi-react-WDC-2025-2026/
├── apps/
│   ├── api-nest/          # backend NestJS
│   └── web-next/          # frontend Next.js
├── prisma/
│   ├── schema.prisma
│   ├── migrations_pg/
│   ├── migrations_mysql/
│   ├── seed.js
│   └── .env (auto)
├── scripts/
│   └── dev                # start/stop/switch stack
├── docker-compose.yml
├── Makefile
└── README.md
```

---

> 🧩 En résumé :  
> - `make db-reset-postgres` / `make db-reset-mariadb` → full reset + seed  
> - `./scripts/dev up nest <db>` → lance la stack complète  
> - tu peux modifier ton schéma et fixtures à volonté, tout se recrée automatiquement 💪
