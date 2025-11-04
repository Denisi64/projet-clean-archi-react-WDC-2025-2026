// prisma.config.ts
import path from "node:path";
import dotenv from "dotenv";
import { defineConfig } from "@prisma/config";

// Charge prisma/.env (DATABASE_URL)
dotenv.config({ path: path.join("prisma", ".env") });

// Choix du dossier migrations via env (fallback: prisma/migrations)
const MIGRATIONS_DIR =
    process.env.PRISMA_MIGRATIONS_DIR || path.join("prisma", "migrations");

export default defineConfig({
    schema: path.join("prisma", "schema.prisma"),
    migrations: {
        path: path.resolve(MIGRATIONS_DIR),
    },
});
