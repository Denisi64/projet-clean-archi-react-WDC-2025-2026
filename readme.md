# Démarrer le projet

Monorepo TypeScript :
- API NestJS `apps/api-nest` (port 3001)
- Front Next.js `apps/web-next` (port 3000) avec API routes pour un mode “Next-only”
- Base Postgres ou MariaDB via Docker

Tout se pilote avec `./scripts/dev`.

## Prérequis
- Docker démarré
- tmux
- Node.js 18+
- npm ou pnpm

## Installation
```
git clone projet-clean-archi-react-WDC-2025-2026
cd projet-clean-archi-react-WDC-2025-2026
npm install
```
Ports : Next 3000, Nest 3001, Postgres 5432, MariaDB 3306.

## Lancer / arrêter
```
./scripts/dev up nest postgres   # cible principale
./scripts/dev up nest mariadb
./scripts/dev up next postgres   # mode Next-only
./scripts/dev up next mariadb

./scripts/dev down               # stoppe tmux + docker
./scripts/dev attach             # se rattacher à tmux
./scripts/dev stop               # ferme tmux, garde docker
```

## Santé
- Nest DB : http://localhost:3001/health/db
- Next : http://localhost:3000 et http://localhost:3000/api/health

## Variables utiles
- `BACKEND_TARGET=nest|next` (par défaut nest)
- `DATABASE_URL=...` (Postgres ou Maria)
- `JWT_SECRET=...` (même valeur pour login/lecture du cookie)
- `CONFIRMATION_TOKEN_TTL_HOURS=24` (optionnel)

## Structure rapide
```
apps/api-nest        # API Nest
apps/web-next        # Front/Routes Next
prisma/              # schémas + migrations + seed
scripts/dev          # orchestration docker + tmux
docker-compose.yml   # services DB + mailhog
```

## Rappel commandes
| Commande                         | Description              |
|----------------------------------|--------------------------|
| `./scripts/dev up nest postgres` | Nest + Postgres          |
| `./scripts/dev up nest mariadb`  | Nest + MariaDB           |
| `./scripts/dev up next postgres` | Next-only + Postgres     |
| `./scripts/dev up next mariadb`  | Next-only + MariaDB      |
| `./scripts/dev down`             | stoppe tout              |
| `./scripts/dev attach`           | se rattacher à tmux      |
| `./scripts/dev stop`             | ferme tmux, garde Docker |
