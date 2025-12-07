import { AccountSummary } from "./AccountRepository";

export type TransferResult = {
    transferId: string;
    source: AccountSummary;
    destination: AccountSummary;
};

export type TransferHistoryItem = {
    id: string;
    source: AccountSummary;
    destination: AccountSummary;
    amount: string;
    note?: string;
    createdAt: Date;
    direction: "IN" | "OUT";
};

export type TransferAccount = {
    id: string;
    userId: string;
    name: string;
    iban: string;
    type: AccountSummary["type"];
    balance: string;
    isActive: boolean;
    createdAt: Date;
};

export interface TransferRepository {
    findAccountById(id: string): Promise<TransferAccount | null>;
    findAccountByIban(iban: string): Promise<TransferAccount | null>;
    executeTransfer(input: {
        sourceAccountId: string;
        destinationAccountId: string;
        amount: string;
        note?: string;
    }): Promise<TransferResult>;

    listForUser(params: { userId: string; accountId?: string }): Promise<TransferHistoryItem[]>;
}
