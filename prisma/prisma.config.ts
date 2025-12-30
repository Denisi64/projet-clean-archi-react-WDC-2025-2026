import { defineConfig } from "@prisma/config";

export default defineConfig({
  schema: "./schema.prisma",
  migrations: {
    directory: process.env.PRISMA_MIGRATIONS_DIR ?? "./migrations",
  },
});
