import { CreditRepository, CreditDetail } from "@proj/domain/credits/ports/CreditRepository";
import { InvalidCreditInputError } from "@proj/domain/credits/errors/InvalidCreditInputError";
import { InvalidCreditTermError } from "@proj/domain/credits/errors/InvalidCreditTermError";
import { Result, err, ok } from "../Result";

type Input = {
    userId: string;
    principal: number;
    annualRate: number;
    insuranceRate: number;
    termMonths: number;
};
type GrantCreditError = InvalidCreditInputError | InvalidCreditTermError | Error;

export class GrantCreditUseCase {
    constructor(private readonly repo: CreditRepository) {}

    private computeMonthlyDue(
        input: Input,
    ): Result<
        {
            monthlyDue: string;
            monthlyBase: number;
            monthlyInsurance: number;
            monthlyRate: number;
        },
        GrantCreditError
    > {
        const { principal, annualRate, insuranceRate, termMonths } = input;
        if (principal <= 0 || annualRate <= 0 || termMonths <= 0 || insuranceRate < 0) {
            return err(new InvalidCreditInputError());
        }
        const monthlyRate = annualRate / 12;
        const monthlyInsurance = (principal * insuranceRate) / termMonths;

        const numerator = principal * monthlyRate;
        const denominator = 1 - Math.pow(1 + monthlyRate, -termMonths);
        if (denominator <= 0) return err(new InvalidCreditTermError());
        const monthlyBase = numerator / denominator;

        const monthlyDue = (monthlyBase + monthlyInsurance).toFixed(2);
        return ok({ monthlyDue, monthlyBase, monthlyInsurance, monthlyRate });
    }

    async execute(input: Input): Promise<Result<CreditDetail, GrantCreditError>> {
        const dueResult = this.computeMonthlyDue(input);
        if (!dueResult.ok) return err(dueResult.error);

        const { monthlyDue, monthlyInsurance } = dueResult.value;
        const principalStr = input.principal.toFixed(2);
        try {
            const credit = await this.repo.create({
                userId: input.userId,
                principal: principalStr,
                initialPrincipal: principalStr,
                remainingPrincipal: principalStr,
                annualRate: input.annualRate,
                insuranceRate: input.insuranceRate,
                termMonths: input.termMonths,
                remainingTermMonths: input.termMonths,
                monthlyDue,
                monthlyInsurance: monthlyInsurance.toFixed(2),
            });
            return ok(credit);
        } catch (e: any) {
            return err(e instanceof Error ? e : new Error("CREDIT_GRANT_FAILED"));
        }
    }
}
