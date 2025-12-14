export type CreditStatus = "PENDING" | "ACTIVE" | "REPAID" | "CANCELED";

export type CreditSummary = {
    id: string;
    userId: string;
    principal: string;
    annualRate: number;
    insuranceRate: number;
    termMonths: number;
    monthlyDue: string;
    status: CreditStatus;
    createdAt: Date;
};

export interface CreditRepository {
    create(input: {
        userId: string;
        principal: string;
        annualRate: number;
        insuranceRate: number;
        termMonths: number;
        monthlyDue: string;
    }): Promise<CreditSummary>;
}
