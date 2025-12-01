## Architecture Overview (Clean Architecture)

- Monorepo TypeScript avec deux apps principales :
    - `apps/api-nest` : API NestJS (port 3001).
    - `apps/web-next` : front Next.js (port 3000, App Router + API routes).
- La logique métier doit vivre dans les packages clean-arch (`domain`, `application`, `infrastructure`, etc.) et être consommée par l’API Nest.
- Les contrôleurs Nest gèrent uniquement HTTP/DTO et délèguent la logique métier aux use cases / services applicatifs.
- Prisma est centralisé dans `prisma/` (schémas, migrations, seed). Les adapters DB se trouvent dans les packages infra.

## Dev workflow & scripts/dev

- Commande recommandée pour la stack principale : `./scripts/dev up nest postgres`.
    - Lance Postgres en Docker, exécute Prisma (generate + migrations + seed), puis démarre Nest (3001) et Next (3000) dans tmux.
- `./scripts/dev up nest mariadb` fait la même chose avec MariaDB.
- `./scripts/dev up next <db>` lance Next en mode “API directe DB” si besoin, mais la cible principale du projet est **Nest + Postgres**.
- `./scripts/dev down` coupe tmux et fait un `docker compose down`. Utiliser cette commande avant de changer de DB ou de target.

## Email confirmation & MailHog (development)

- En dev, les e-mails sont envoyés via MailHog (service Docker `mailhog`, ports 1025/8025). L’UI est accessible sur `http://localhost:8025`.
- L’API Nest lit les variables suivantes dans `apps/api-nest/.env` :
    - `SMTP_HOST=mailhog`
    - `SMTP_PORT=1025`
    - `SMTP_FROM=no-reply@avenir.bank`
    - `FRONT_APP_URL=http://localhost:3000`
    - `CONFIRMATION_TOKEN_TTL_HOURS=24`
- Flux d’inscription client :
    - à l’inscription, l’utilisateur est créé avec `isActive = false`, `confirmationToken` et `confirmationTokenExpiresAt` renseignés.
    - un e-mail de confirmation est envoyé avec un lien : `${FRONT_APP_URL}/auth/confirm?token=<token>`.
    - la route Nest `/auth/confirm` valide le token, active l’utilisateur, puis nettoie le token.
- Côté Next, la page `/auth/confirm` appelle une route `/api/auth/confirm` qui proxie vers l’API Nest, plutôt que de parler directement à la base.
