# Démarrer le projet (Next / Nest + Postgres / MariaDB)

Ce projet est un monorepo TypeScript avec :
- une API **NestJS** (`apps/api-nest`, port `3001`)
- un front **Next.js** (`apps/web-next`, port `3000`)
- une base de données **PostgreSQL** ou **MariaDB** via Docker

Tout se lance avec le script `./scripts/dev`.

---

## Prérequis

- Docker installé et démarré
- tmux installé
- Node.js 18+
- npm / pnpm

---

## Installation

    git clone  projet-clean-archi-react-WDC-2025-2026
    cd projet-clean-archi-react-WDC-2025-2026
    npm install

Ports utilisés :
- Next : `3000`
- Nest : `3001`
- Postgres : `5432`
- MariaDB : `3306`

---

## Lancer / arrêter la stack

### Nest + Postgres (setup par défaut)

    ./scripts/dev up nest postgres 
    ./scripts/dev down

    ./scripts/dev up nest mariadb
    ./scripts/dev up next postgres
    ./scripts/dev up next mariadb

## tmux

- Attacher à la session :

      ./scripts/dev attach

- Stopper tmux sans toucher aux conteneurs :

      ./scripts/dev stop

---

## Vérifier que ça tourne

- Nest (santé DB) :  
  `http://localhost:3001/health/db`

- Next :  
  `http://localhost:3000`  
  `http://localhost:3000/api/health`

---

## Structure rapide

    .
    ├─ apps/
    │  ├─ api-nest/        # API NestJS
    │  └─ web-next/        # Front Next.js
    ├─ prisma/             # schémas Prisma + migrations
    ├─ docker-compose.yml  # services BDD
    └─ scripts/
       └─ dev              # script principal (up/down/attach)

---

## Rappel commandes utiles

| Commande                          | Description                |
|-----------------------------------|----------------------------|
| `./scripts/dev up nest postgres`  | Nest + Postgres           |
| `./scripts/dev up nest mariadb`   | Nest + MariaDB            |
| `./scripts/dev up next postgres`  | Next + Postgres           |
| `./scripts/dev up next mariadb`   | Next + MariaDB            |
| `./scripts/dev down`              | stoppe tout               |
| `./scripts/dev attach`            | se rattacher à tmux       |
| `./scripts/dev stop`              | ferme tmux, garde Docker  |
