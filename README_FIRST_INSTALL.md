# First Install - Avenir Bank Monorepo

Ce document decrit l'installation et le demarrage sur Windows, macOS et Linux.

## Resume rapide
1) Installer les prerequis
2) Lancer:
   ./scripts/first-install.sh
3) Demarrer la stack:
   ./scripts/dev up nest postgres

## Prerequis (Windows / macOS / Linux)
- Node.js 20 LTS recommande (minimum 18.17)
- pnpm 10.18.1 (via corepack)
- Docker + docker compose
- tmux (requis par scripts/dev)

### Installer pnpm (toutes plateformes)
1) corepack enable
2) corepack prepare pnpm@10.18.1 --activate

## Windows (recommande: WSL2)
1) Installer WSL2 + Ubuntu
2) Installer Docker Desktop et activer l'integration WSL
3) Ouvrir un terminal WSL dans le repo
4) Lancer:
   ./scripts/first-install.sh
   ./scripts/dev up nest postgres

## macOS
1) Installer Node 20 (nvm ou brew)
2) Installer Docker Desktop
3) Installer tmux:
   brew install tmux
4) Lancer:
   ./scripts/first-install.sh
   ./scripts/dev up nest postgres

## Linux
1) Installer Node 20 (nvm recommande)
2) Installer Docker Engine + docker compose plugin
3) Installer tmux:
   sudo apt install tmux
4) Lancer:
   ./scripts/first-install.sh
   ./scripts/dev up nest postgres

## Demarrage / Arret
- Start (Nest + Postgres):
  ./scripts/dev up nest postgres
- Start (Nest + MariaDB):
  ./scripts/dev up nest mariadb
- Attach tmux:
  ./scripts/dev attach
- Stop:
  ./scripts/dev stop
- Down (stop + docker compose down):
  ./scripts/dev down

## Endpoints utiles
- Web: http://localhost:3000
- API (si nest): http://localhost:3001/health/db
- Health front: http://localhost:3000/api/health

## Depannage rapide
- Docker ne demarre pas: lancer Docker Desktop / systemctl start docker
- Permission Docker (Linux): ajouter l'utilisateur au groupe docker
- Ports 3000/3001 occupes: fermer le process ou changer le port
- pnpm manquant:
  corepack enable
  corepack prepare pnpm@10.18.1 --activate
- Reinstaller les dependances:
  ./scripts/first-install.sh --force-install
