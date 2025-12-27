import { CreditRepository, CreditDetail } from "../../domain/credits/ports/CreditRepository";
import { CreditNotFoundError } from "../../domain/credits/errors/CreditNotFoundError";
import { CreditInactiveError } from "../../domain/credits/errors/CreditInactiveError";
import { InvalidCreditAmountError } from "../../domain/credits/errors/InvalidCreditAmountError";
import { InvalidCreditRepaymentError } from "../../domain/credits/errors/InvalidCreditRepaymentError";

export class RepayCreditUseCase {
    constructor(private readonly repo: CreditRepository) {}

    private toNumber(value: string): number {
        const n = Number(value);
        if (!Number.isFinite(n)) throw new InvalidCreditAmountError();
        return n;
    }

    async execute(creditId: string): Promise<CreditDetail> {
        const credit = await this.repo.findById(creditId);
        if (!credit) throw new CreditNotFoundError();
        if (credit.status !== "ACTIVE") throw new CreditInactiveError();

        const remainingPrincipal = this.toNumber(credit.remainingPrincipal);
        const monthlyDue = this.toNumber(credit.monthlyDue);
        const monthlyInsurance = this.toNumber(credit.monthlyInsurance);
        const monthlyRate = credit.annualRate / 12;

        const interest = remainingPrincipal * monthlyRate;
        const principalPart = monthlyDue - interest - monthlyInsurance;
        if (principalPart <= 0) throw new InvalidCreditRepaymentError();

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

        return this.repo.save(updated);
    }
}
