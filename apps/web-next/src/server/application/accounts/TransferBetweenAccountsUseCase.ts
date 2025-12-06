import {
    TransferRepository,
    TransferResult,
    TransferAccount,
} from "../../domain/accounts/ports/TransferRepository";
import { InvalidTransferAmountError } from "../../domain/accounts/errors/InvalidTransferAmountError";
import { AccountNotFoundError } from "../../domain/accounts/errors/AccountNotFoundError";
import { AccountInactiveError } from "../../domain/accounts/errors/AccountInactiveError";
import { SameAccountTransferError } from "../../domain/accounts/errors/SameAccountTransferError";
import { InsufficientFundsError } from "../../domain/accounts/errors/InsufficientFundsError";

type Input = {
    userId: string;
    sourceAccountId: string;
    destinationIban: string;
    amount: string;
    note?: string;
};

export class TransferBetweenAccountsUseCase {
    constructor(private readonly repo: TransferRepository) {}

    private toCents(value: string): number {
        const [intPart, decPart = ""] = value.split(".");
        const normalizedDec = (decPart + "00").slice(0, 2);
        const cents = Number(intPart) * 100 + Number(normalizedDec);
        if (!Number.isFinite(cents)) {
            throw new InvalidTransferAmountError();
        }
        return cents;
    }

    private formatCents(cents: number): string {
        const sign = cents < 0 ? "-" : "";
        const abs = Math.abs(cents);
        const euros = Math.floor(abs / 100);
        const decimals = (abs % 100).toString().padStart(2, "0");
        return `${sign}${euros}.${decimals}`;
    }

    private normalizeAmount(amount: string): string {
        const trimmed = amount.trim();
        const match = trimmed.match(/^\d+(\.\d{1,2})?$/);
        if (!match) {
            throw new InvalidTransferAmountError();
        }
        const cents = this.toCents(trimmed);
        if (cents <= 0) {
            throw new InvalidTransferAmountError();
        }
        return this.formatCents(cents);
    }

    private ensureAccountsValid(input: {
        userId: string;
        source: TransferAccount | null;
        destination: TransferAccount | null;
        amountCents: number;
    }) {
        const { userId, source, destination, amountCents } = input;
        if (!source || source.userId !== userId) {
            throw new AccountNotFoundError();
        }
        if (!destination) {
            throw new AccountNotFoundError();
        }
        if (source.id === destination.id) {
            throw new SameAccountTransferError();
        }
        if (!source.isActive || !destination.isActive) {
            throw new AccountInactiveError();
        }
        const sourceBalanceCents = this.toCents(source.balance);
        if (sourceBalanceCents < amountCents) {
            throw new InsufficientFundsError();
        }
    }

    async execute(input: Input): Promise<TransferResult> {
        const normalizedAmount = this.normalizeAmount(input.amount ?? "");
        const amountCents = this.toCents(normalizedAmount);

        const [source, destination] = await Promise.all([
            this.repo.findAccountById(input.sourceAccountId),
            this.repo.findAccountByIban(input.destinationIban.trim()),
        ]);

        this.ensureAccountsValid({
            userId: input.userId,
            source,
            destination,
            amountCents,
        });

        return this.repo.executeTransfer({
            sourceAccountId: input.sourceAccountId,
            destinationAccountId: destination!.id,
            amount: normalizedAmount,
            note: input.note?.trim(),
        });
    }
}
