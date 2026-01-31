import { Advisor, AdvisorRepository } from "@proj/domain/chat/ports/AdvisorRepository";
import { getDrizzleDb } from "../db/drizzle/client";
import { users } from "../db/drizzle/schema";
import { eq } from "drizzle-orm";

export class DrizzleAdvisorRepository implements AdvisorRepository {
    async findAllAdvisors(): Promise<Advisor[]> {
        const db = getDrizzleDb();
        const rows = await db
            .select({ id: users.id, email: users.email, role: users.role })
            .from(users)
            .where(eq(users.role, "ADVISOR"));

        return rows.map((row) => ({
            id: row.id,
            email: row.email,
            role: row.role,
        }));
    }
}
