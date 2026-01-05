export type SavingsAccount = {
    id: string;
    balance: string;
    isActive: boolean;
};

export interface SavingsInterestRepository {
    listActiveSavingsAccounts(): Promise<SavingsAccount[]>;
    creditInterest(input: { accountId: string; amount: string; note?: string }): Promise<void>;
}
