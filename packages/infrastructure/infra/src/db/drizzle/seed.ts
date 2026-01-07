import bcrypt from "bcrypt";
import { and, eq, sql } from "drizzle-orm";
import { closeDrizzleDb, getDrizzleDb } from "./client";
import {
    accounts,
    actions,
    interestAccrual,
    operations,
    orders,
    portfolio,
    tauxEpargne,
    transfers,
    users,
} from "./schema";
import { newId } from "./ids";

type SeedUser = {
    email: string;
    name: string;
    role: "CLIENT" | "ADVISOR" | "DIRECTOR";
};

async function upsertUser(db: ReturnType<typeof getDrizzleDb>, user: SeedUser, hash: string): Promise<string> {
    const now = new Date();
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, user.email)).limit(1);
    if (existing[0]) {
        await db
            .update(users)
            .set({
                password: hash,
                name: user.name,
                role: user.role,
                isActive: true,
                confirmationToken: null,
                confirmationTokenExpiresAt: null,
                updatedAt: now,
            })
            .where(eq(users.id, existing[0].id));
        return existing[0].id;
    }

    const id = newId();
    await db.insert(users).values({
        id,
        email: user.email,
        name: user.name,
        password: hash,
        role: user.role,
        isActive: true,
        createdAt: now,
        updatedAt: now,
    });
    return id;
}

async function upsertAccount(db: ReturnType<typeof getDrizzleDb>, data: {
    userId: string;
    iban: string;
    name: string;
    type: "CURRENT" | "SAVINGS";
    balance: string;
}): Promise<string> {
    const now = new Date();
    const existing = await db.select({ id: accounts.id }).from(accounts).where(eq(accounts.iban, data.iban)).limit(1);
    if (existing[0]) {
        await db
            .update(accounts)
            .set({
                userId: data.userId,
                name: data.name,
                type: data.type,
                balance: data.balance,
                isActive: true,
                updatedAt: now,
            })
            .where(eq(accounts.id, existing[0].id));
        return existing[0].id;
    }

    const id = newId();
    await db.insert(accounts).values({
        id,
        userId: data.userId,
        iban: data.iban,
        name: data.name,
        type: data.type,
        balance: data.balance,
        isActive: true,
        createdAt: now,
        updatedAt: now,
    });
    return id;
}

async function upsertAction(db: ReturnType<typeof getDrizzleDb>, data: {
    symbol: string;
    name: string;
    price: string;
    availableStock: string;
    isAvailable: boolean;
}): Promise<string> {
    const now = new Date();
    const existing = await db.select({ id: actions.id }).from(actions).where(eq(actions.symbol, data.symbol)).limit(1);
    if (existing[0]) {
        await db
            .update(actions)
            .set({
                name: data.name,
                price: data.price,
                availableStock: data.availableStock,
                isAvailable: data.isAvailable,
                updatedAt: now,
            })
            .where(eq(actions.id, existing[0].id));
        return existing[0].id;
    }

    const id = newId();
    await db.insert(actions).values({
        id,
        symbol: data.symbol,
        name: data.name,
        price: data.price,
        availableStock: data.availableStock,
        isAvailable: data.isAvailable,
        createdAt: now,
        updatedAt: now,
    });
    return id;
}

async function upsertSavingsRate(db: ReturnType<typeof getDrizzleDb>, rate: string): Promise<string> {
    const now = new Date();
    const rateId = "global-rate";
    const existing = await db.select({ id: tauxEpargne.id }).from(tauxEpargne).where(eq(tauxEpargne.id, rateId)).limit(1);
    if (existing[0]) {
        await db.update(tauxEpargne).set({ rate, active: true, updatedAt: now }).where(eq(tauxEpargne.id, rateId));
        return rateId;
    }

    await db.insert(tauxEpargne).values({ id: rateId, rate, active: true, createdAt: now, updatedAt: now });
    return rateId;
}

async function main(): Promise<void> {
    const db = getDrizzleDb();
    const hash = await bcrypt.hash("demo12345", 10);

    const clientId = await upsertUser(db, { email: "client@avenir.bank", name: "Client Démo", role: "CLIENT" }, hash);
    const advisorId = await upsertUser(
        db,
        { email: "advisor@avenir.bank", name: "Conseiller Démo", role: "ADVISOR" },
        hash,
    );
    const directorId = await upsertUser(
        db,
        { email: "director@avenir.bank", name: "Directeur Démo", role: "DIRECTOR" },
        hash,
    );

    if (!advisorId || !directorId) {
        // keep lint happy, ids are used by side effects
    }

    const currentId = await upsertAccount(db, {
        userId: clientId,
        iban: "FR7630006000011234567890189",
        name: "Compte Courant",
        type: "CURRENT",
        balance: "5000.00",
    });
    const savingsId = await upsertAccount(db, {
        userId: clientId,
        iban: "FR7630006000019999999999999",
        name: "Livret Avenir",
        type: "SAVINGS",
        balance: "2500.00",
    });

    const rateId = await upsertSavingsRate(db, "0.0125");

    const avaId = await upsertAction(db, {
        symbol: "AVA",
        name: "Avenir Bank SA",
        price: "100.00",
        availableStock: "1000.00",
        isAvailable: true,
    });
    const neoId = await upsertAction(db, {
        symbol: "NEO",
        name: "NEOWare",
        price: "50.00",
        availableStock: "500.00",
        isAvailable: true,
    });

    const now = new Date();
    await db
        .insert(portfolio)
        .values({
            id: newId(),
            userId: clientId,
            actionId: avaId,
            quantity: "10",
            avgPrice: "100.00",
            updatedAt: now,
        })
        .onDuplicateKeyUpdate({ set: { quantity: "10", avgPrice: "100.00" } });

    const existingOrder = await db
        .select({ id: orders.id })
        .from(orders)
        .where(and(eq(orders.userId, clientId), eq(orders.actionId, neoId), eq(orders.side, "BUY"), eq(orders.status, "OPEN")))
        .limit(1);
    if (!existingOrder[0]) {
        await db.insert(orders).values({
            id: newId(),
            userId: clientId,
            actionId: neoId,
            side: "BUY",
            quantity: "5",
            limitPrice: "50.00",
            status: "OPEN",
            fee: "1.00",
        });
    }

    const transferNote = "Alimentation livret";
    const transferAmount = "100.00";
    const existingTransfer = await db
        .select({ id: transfers.id })
        .from(transfers)
        .where(
            and(
                eq(transfers.sourceAccountId, currentId),
                eq(transfers.destAccountId, savingsId),
                eq(transfers.amount, transferAmount),
                eq(transfers.note, transferNote),
            ),
        )
        .limit(1);
    if (!existingTransfer[0]) {
        await db.transaction(async (tx) => {
            const transferId = newId();
            await tx.insert(transfers).values({
                id: transferId,
                sourceAccountId: currentId,
                destAccountId: savingsId,
                amount: transferAmount,
                note: transferNote,
            });
            await tx.insert(operations).values([
                {
                    id: newId(),
                    accountId: currentId,
                    kind: "DEBIT",
                    amount: transferAmount,
                    transferId,
                    metadata: "Transfert interne vers livret",
                },
                {
                    id: newId(),
                    accountId: savingsId,
                    kind: "CREDIT",
                    amount: transferAmount,
                    transferId,
                    metadata: "Transfert interne depuis courant",
                },
            ]);
            await tx
                .update(accounts)
                .set({ balance: sql`${accounts.balance} - ${transferAmount}` })
                .where(eq(accounts.id, currentId));
            await tx
                .update(accounts)
                .set({ balance: sql`${accounts.balance} + ${transferAmount}` })
                .where(eq(accounts.id, savingsId));
        });
    }

    const existingAccrual = await db
        .select({ id: interestAccrual.id })
        .from(interestAccrual)
        .where(and(eq(interestAccrual.accountId, savingsId), eq(interestAccrual.rateId, rateId)))
        .limit(1);
    if (!existingAccrual[0]) {
        await db.insert(interestAccrual).values({
            id: newId(),
            accountId: savingsId,
            rateId,
            amount: "0.86",
        });
    }

    console.log("Seed Drizzle OK (users: client@avenir.bank / advisor@avenir.bank / director@avenir.bank, mdp: demo12345)");
    await closeDrizzleDb();
}

main().catch((err) => {
    console.error("Seed Drizzle errors:", err);
    closeDrizzleDb()
        .catch(() => {})
        .finally(() => process.exit(1));
});
