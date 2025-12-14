export type CreditStatus = "PENDING" | "ACTIVE" | "REPAID" | "CANCELED";

export type CreditDetail = {
    id: string;
    userId: string;
    principal: string;
    initialPrincipal: string;
    remainingPrincipal: string;
    annualRate: number;
    insuranceRate: number;
    termMonths: number;
    remainingTermMonths: number;
    monthlyDue: string;
    monthlyInsurance: string;
    status: CreditStatus;
    createdAt: Date;
    repaidAt?: Date | null;
};

export interface CreditRepository {
    create(input: {
        userId: string;
        principal: string;
        initialPrincipal: string;
        remainingPrincipal: string;
        annualRate: number;
        insuranceRate: number;
        termMonths: number;
        remainingTermMonths: number;
        monthlyDue: string;
        monthlyInsurance: string;
    }): Promise<CreditDetail>;

    findById(id: string): Promise<CreditDetail | null>;
    save(credit: CreditDetail): Promise<CreditDetail>;
}
