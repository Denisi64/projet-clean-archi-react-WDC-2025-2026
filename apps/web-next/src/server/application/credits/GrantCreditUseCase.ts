import { CreditRepository, CreditSummary } from "../../domain/credits/ports/CreditRepository";

type Input = {
    userId: string;
    principal: number;
    annualRate: number;
    insuranceRate: number;
    termMonths: number;
};

export class GrantCreditUseCase {
    constructor(private readonly repo: CreditRepository) {}

    private computeMonthlyDue(input: Input): { monthlyDue: string } {
        const { principal, annualRate, insuranceRate, termMonths } = input;
        if (principal <= 0 || annualRate <= 0 || termMonths <= 0 || insuranceRate < 0) {
            throw new Error("INVALID_INPUT");
        }
        const monthlyRate = annualRate / 12;
        const monthlyInsurance = (principal * insuranceRate) / termMonths;

        const numerator = principal * monthlyRate;
        const denominator = 1 - Math.pow(1 + monthlyRate, -termMonths);
        if (denominator <= 0) throw new Error("INVALID_TERM");
        const monthlyBase = numerator / denominator;

        const monthlyDue = (monthlyBase + monthlyInsurance).toFixed(2);
        return { monthlyDue };
    }

    async execute(input: Input): Promise<CreditSummary> {
        const { monthlyDue } = this.computeMonthlyDue(input);

        return this.repo.create({
            userId: input.userId,
            principal: input.principal.toFixed(2),
            annualRate: input.annualRate,
            insuranceRate: input.insuranceRate,
            termMonths: input.termMonths,
            monthlyDue,
        });
    }
}
