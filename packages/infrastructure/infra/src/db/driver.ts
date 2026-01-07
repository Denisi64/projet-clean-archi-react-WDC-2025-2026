import { DbDriver } from "@proj/application/ports/DbHealth.port";

export function resolveDbDriver(raw: string | undefined = process.env.DB_DRIVER): DbDriver {
    const value = (raw ?? "postgres").toLowerCase();
    if (value === "mariadb" || value === "mysql") return "mariadb";
    if (value === "memory") return "memory";
    return "postgres";
}
