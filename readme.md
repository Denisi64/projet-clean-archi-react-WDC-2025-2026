# 🧰 Démarrer le projet (Next/Nest + Postgres/MariaDB) en 2 commandes

Ce monorepo permet de lancer **au choix** une API **NestJS** ou un **Next.js “API mode”**, tous deux connectés à **la même base de données** (PostgreSQL ou MariaDB), via un script unique basé sur **tmux**.

---

## 🧱 Prérequis

### 🐋 Docker Engine (daemon système)

#### Linux (Ubuntu/Mint)
```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
# (si besoin) installer Docker depuis docs.docker.com
sudo usermod -aG docker "$USER"
# reconnecte-toi ou: newgrp docker
sudo systemctl enable --now docker
```

### 🧩 tmux
```bash
sudo apt install -y tmux
```

### 💻 Node.js 18+ (ou 20+ recommandé)
Node inclut déjà `npm`.  
Le repo utilise `pnpm` mais tu peux utiliser `npm install`.

---

## 📦 Installation

```bash
git clone <votre-repo> projet-clean-archi-react-WDC-2025-2026
cd projet-clean-archi-react-WDC-2025-2026

# Dépendances JS (monorepo)
npm install
```

> **Ports utilisés**
> - Front (Next): `3000`
> - API (Nest): `3001`
> - Postgres: `5432`
> - MariaDB: `3306`

Libérer les ports si besoin :
```bash
fuser -k 3000/tcp 2>/dev/null || true
fuser -k 3001/tcp 2>/dev/null || true
```

---

## 🚀 Lancer le projet (2 commandes)

Le script principal est `./scripts/dev`.

### ▶️ Démarrer (API **Nest** + **Postgres**)
```bash
./scripts/dev up nest postgres
```

### ⏹️ Arrêter tout
```bash
./scripts/dev down
```

---

## ⚙️ Variantes de lancement

- **Nest + MariaDB**
  ```bash
  ./scripts/dev up nest mariadb
  ```

- **Next (API Routes) + Postgres**
  ```bash
  ./scripts/dev up next postgres
  ```

- **Next (API Routes) + MariaDB**
  ```bash
  ./scripts/dev up next mariadb
  ```

- **Mode mémoire (sans base Docker)**
  ```bash
  ./scripts/dev up nest memory
  ./scripts/dev up next memory
  ```

> Le script :
> - met à jour automatiquement les fichiers `.env`
    >   - `apps/api-nest/.env` : `PORT`, `DATABASE_URL`, `DB_DRIVER`
>   - `apps/web-next/.env.local` : `NODE_ENV`, `BACKEND_TARGET`, `NEST_API_URL`
> - ajuste automatiquement `prisma/schema.prisma`
> - exécute `prisma generate` et `prisma migrate deploy`
> - ouvre **tmux** avec deux panneaux : **API** et **WEB**

---

## 🖥️ Contrôle des terminaux

### 🔗 Attacher à la session tmux
```bash
./scripts/dev attach
```

- Pane gauche : API NestJS (ou message “Target=next → pas d’API”)
- Pane droite : Web Next.js

### 🧹 Stopper sans fermer Docker
```bash
./scripts/dev stop
```

---

## ✅ Vérifier les services

### NestJS
- URL santé : [http://localhost:3001/health/db](http://localhost:3001/health/db)
- Retourne :
  ```json
  { "backend": "nest", "driver": "postgres", "ok": true }
  ```

### Next.js
- Page : [http://localhost:3000/health](http://localhost:3000/health)
- API Route : [http://localhost:3000/api/health](http://localhost:3000/api/health)
    - Proxy vers `http://localhost:3001/health/db` si `BACKEND_TARGET=nest`

---

## 🔌 Prisma et Base de Données

Le dossier Prisma est **partagé** (`/prisma`) pour Nest et Next.

Le script :
- modifie automatiquement le provider (`postgresql` ↔ `mysql`)
- exécute :
  ```bash
  npx prisma generate
  npx prisma migrate deploy
  ```
- retente plusieurs fois si la DB n’est pas encore prête
- utilise `prisma db push` en fallback

---

## 🔄 Scénarios typiques

### 🔁 Switcher Nest ⇄ Next
```bash
./scripts/dev down
./scripts/dev up next postgres
./scripts/dev down
./scripts/dev up nest postgres
```

### 🧭 Changer de SGBD
```bash
./scripts/dev down
./scripts/dev up nest mariadb
```

---

## 🧯 Dépannage

### ❌ Docker ne démarre pas
```bash
unset DOCKER_HOST
export DOCKER_CONTEXT=system
sudo systemctl enable --now docker
docker ps
```
Si besoin :
```bash
sudo usermod -aG docker "$USER"
newgrp docker
```

---

### ⚠️ Port déjà utilisé
```bash
fuser -k 3000/tcp 2>/dev/null || true
fuser -k 3001/tcp 2>/dev/null || true
```

---

### ⚙️ “Failed to parse URL from /api/health”
Le composant `/health` doit appeler :
```ts
await fetch('/api/health', { cache: 'no-store' });
```
et non pas un chemin absolu côté client.

---

### 💾 Mauvais driver (Nest affiche `DB_DRIVER = memory`)
Vérifie le fichier :
```
apps/api-nest/.env
```
Tu dois voir :
```
DB_DRIVER=postgres
DATABASE_URL=postgresql://user:pass@localhost:5432/bank?schema=public
```

---

## 🗂️ Structure du projet

```
.
├─ apps/
│  ├─ api-nest/           # API NestJS
│  │  └─ .env
│  └─ web-next/           # Front Next.js
│     └─ .env.local
├─ prisma/                # Schéma Prisma partagé
├─ docker-compose.yml     # Services BDD
└─ scripts/
   └─ dev                 # Script principal (up/down/attach)
```

---

## 🧠 Récapitulatif rapide

| Commande | Action |
|-----------|--------|
| `./scripts/dev up nest postgres` | Démarre Nest + Postgres |
| `./scripts/dev up nest mariadb` | Démarre Nest + MariaDB |
| `./scripts/dev up next postgres` | Démarre Next + Postgres |
| `./scripts/dev up next mariadb` | Démarre Next + MariaDB |
| `./scripts/dev down` | Stoppe tout (tmux + docker) |
| `./scripts/dev attach` | Rouvre la session tmux |
| `./scripts/dev stop` | Ferme tmux sans docker down |

---

✨ **En résumé :**
- **2 commandes suffisent** (`up` / `down`)
- **Même base Prisma et DB pour Nest et Next**
- **Fichiers `.env` gérés automatiquement**
- **Aucun setup manuel requis après install**