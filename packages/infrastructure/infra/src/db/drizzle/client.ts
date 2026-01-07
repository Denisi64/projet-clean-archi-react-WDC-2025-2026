import { drizzle } from "drizzle-orm/mysql2";
import { createPool, Pool } from "mysql2/promise";
import * as schema from "./schema";

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

export function getDrizzleDb() {
    if (db) return db;

    const url = process.env.DATABASE_URL;
    if (!url) {
        throw new Error("DATABASE_URL is required for MariaDB/Drizzle");
    }

    pool = createPool(url);
    db = drizzle(pool, { schema, mode: "default" });
    return db;
}

export async function closeDrizzleDb(): Promise<void> {
    if (!pool) return;
    await pool.end();
    pool = null;
    db = null;
}
