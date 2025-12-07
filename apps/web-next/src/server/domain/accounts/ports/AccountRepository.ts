export type AccountType = "CURRENT" | "SAVINGS";

export type AccountSummary = {
    id: string;
    name: string;
    iban: string;
    type: AccountType;
    balance: string;
    isActive: boolean;
    createdAt: Date;
};

export interface AccountRepository {
    findByUserId(userId: string): Promise<AccountSummary[]>;
    createForUser(input: { userId: string; name: string; type: AccountType }): Promise<AccountSummary>;
    rename(input: { accountId: string; userId: string; name: string }): Promise<AccountSummary>;
    close(input: { accountId: string; userId: string }): Promise<AccountSummary>;
}
