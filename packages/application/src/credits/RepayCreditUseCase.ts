import { CreditRepository, CreditDetail } from "@proj/domain/credits/ports/CreditRepository";
import { CreditNotFoundError } from "@proj/domain/credits/errors/CreditNotFoundError";
import { CreditInactiveError } from "@proj/domain/credits/errors/CreditInactiveError";
import { InvalidCreditAmountError } from "@proj/domain/credits/errors/InvalidCreditAmountError";
import { InvalidCreditRepaymentError } from "@proj/domain/credits/errors/InvalidCreditRepaymentError";
import { Result, err, ok } from "../Result";

export class RepayCreditUseCase {
    constructor(private readonly repo: CreditRepository) {}

    private toNumber(value: string): Result<number, InvalidCreditAmountError> {
        const n = Number(value);
        if (!Number.isFinite(n)) return err(new InvalidCreditAmountError());
        return ok(n);
    }

    async execute(
        creditId: string,
    ): Promise<Result<CreditDetail, CreditNotFoundError | CreditInactiveError | InvalidCreditAmountError | InvalidCreditRepaymentError | Error>> {
        try {
            const credit = await this.repo.findById(creditId);
            if (!credit) return err(new CreditNotFoundError());
            if (credit.status !== "ACTIVE") return err(new CreditInactiveError());

            const remainingPrincipalResult = this.toNumber(credit.remainingPrincipal);
            if (!remainingPrincipalResult.ok) return err(remainingPrincipalResult.error);
            const monthlyDueResult = this.toNumber(credit.monthlyDue);
            if (!monthlyDueResult.ok) return err(monthlyDueResult.error);
            const monthlyInsuranceResult = this.toNumber(credit.monthlyInsurance);
            if (!monthlyInsuranceResult.ok) return err(monthlyInsuranceResult.error);

            const remainingPrincipal = remainingPrincipalResult.value;
            const monthlyDue = monthlyDueResult.value;
            const monthlyInsurance = monthlyInsuranceResult.value;
            const monthlyRate = credit.annualRate / 12;

            const interest = remainingPrincipal * monthlyRate;
            const principalPart = monthlyDue - interest - monthlyInsurance;
            if (principalPart <= 0) return err(new InvalidCreditRepaymentError());

            const newRemainingPrincipal = Math.max(0, remainingPrincipal - principalPart);
            const newRemainingTerm = Math.max(0, credit.remainingTermMonths - 1);
            const shouldClose = newRemainingPrincipal <= 0 || newRemainingTerm <= 0;

            const updated: CreditDetail = {
                ...credit,
                remainingPrincipal: newRemainingPrincipal.toFixed(2),
                remainingTermMonths: newRemainingTerm,
                status: shouldClose ? "REPAID" : credit.status,
                repaidAt: shouldClose ? new Date() : credit.repaidAt,
            };

            const saved = await this.repo.save(updated);
            return ok(saved);
        } catch (e: any) {
            return err(e instanceof Error ? e : new Error("CREDIT_REPAY_FAILED"));
        }
    }
}
