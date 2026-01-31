# Démarrer le projet

## Equipe
- DENIS Simon 5IW
- CHAN Francis 5IW
- WARTNER Grégoire 5IW

Monorepo TypeScript :
- Front Next.js `apps/web-next` (port 3000) avec API routes
- Base Postgres via Docker

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

## Fixtures / jeux de donnees
Le seed est automatique lors du lancement via `./scripts/dev up ...`.

Comptes de test (seed):
- Client: `client@avenir.bank` / `demo12345`
- Conseiller: `advisor@avenir.bank` / `demo12345`
- Conseiller 2: `advisor2@avenir.bank` / `demo12345`
- Directeur (admin): `director@avenir.bank` / `demo12345`

Si besoin de relancer le seed manuellement:
```
pnpm -w prisma db seed
```

## Lancer / arrêter
```
./scripts/dev up next postgres   # cible principale

./scripts/dev down               # stoppe tmux + docker
./scripts/dev attach             # se rattacher à tmux
./scripts/dev stop               # ferme tmux, garde docker
```

## Santé
- Next : http://localhost:3000 et http://localhost:3000/api/health

## Variables utiles
- `BACKEND_TARGET=next`
- `DATABASE_URL=...` (Postgres)
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
| `./scripts/dev up next postgres` | Next + Postgres          |
| `./scripts/dev down`             | stoppe tout              |
| `./scripts/dev attach`           | se rattacher à tmux      |
| `./scripts/dev stop`             | ferme tmux, garde Docker |

## Épargne – appliquer les intérêts (admin)
Taux annuel via `SAVINGS_INTEREST_RATE` (défaut 0.02) ou via l’UI Directeur (stocké en base). Token admin via `ADMIN_TOKEN` (défaut `dev-admin`).

```
# Backend Next (port 3000)
curl -X POST http://localhost:3000/api/admin/savings/apply-interest -H "x-admin-token: dev-admin"
curl -X POST "http://localhost:3000/api/admin/savings/apply-interest?mode=annual" -H "x-admin-token: dev-admin"   # applique le taux annuel en une fois

# Lire et mettre à jour le taux (en %) pour le stocker en base
curl -H "x-admin-token: dev-admin" http://localhost:3000/api/admin/savings/rate
curl -X POST -H "x-admin-token: dev-admin" -H "content-type: application/json" \
  -d '{"ratePercent":2.5}' http://localhost:3000/api/admin/savings/rate   # met 2.5%

# Exemple cron local (intérêts journaliers à 01h00, backend Next)
# 0 1 * * * curl -s -X POST http://localhost:3000/api/admin/savings/apply-interest -H "x-admin-token: dev-admin" >/tmp/interest.log 2>&1

# Exemple pour appliquer le taux annuel en une seule fois
# curl -s -X POST "http://localhost:3000/api/admin/savings/apply-interest?mode=annual" -H "x-admin-token: dev-admin"
```

## Crédit – conseiller (octroi)
Taux assurance appliqué sur le capital et réparti dans les mensualités (annuité constante).

```
# Backend Next (port 3000)
curl -X POST http://localhost:3000/api/advisor/credits \
  -H "content-type: application/json" \
  -d '{"userId":"cmj68d7kb0000ee8x66ih6p9b","principal":10000,"annualRate":0.03,"insuranceRate":0.002,"termMonths":36}'

# Rembourser une mensualité (conseiller)
curl -X POST http://localhost:3000/api/advisor/credits/<creditId>/repay

# Vérifier la langue UI (fr/en) :
# http://localhost:3000/?lang=fr
# http://localhost:3000/?lang=en
```

## Langues (UI)
- Paramètre `?lang=fr` ou `?lang=en` sur les pages (ex: `http://localhost:3000/?lang=en`) pour basculer l’interface. Front par défaut en français.

## Migrations Prisma (schéma crédit mis à jour)
- Postgres : `make db-reset-postgres` (ou `pnpm -w prisma migrate dev --schema=prisma/schema.prisma`)
