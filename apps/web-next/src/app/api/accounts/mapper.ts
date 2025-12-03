import { Account } from "@prisma/client";

export function mapAccount(acc: Account) {
    return {
        id: acc.id,
        name: acc.name,
        iban: acc.iban,
        type: acc.type,
        balance: acc.balance.toString(),
        isActive: acc.isActive,
        createdAt: acc.createdAt.toISOString(),
    };
}
