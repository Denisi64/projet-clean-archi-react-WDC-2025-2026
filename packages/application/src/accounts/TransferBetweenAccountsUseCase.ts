import {
    TransferRepository,
    TransferResult,
    TransferAccount,
} from "@proj/domain/accounts/ports/TransferRepository";
import { InvalidTransferAmountError } from "@proj/domain/accounts/errors/InvalidTransferAmountError";
import { AccountNotFoundError } from "@proj/domain/accounts/errors/AccountNotFoundError";
import { AccountInactiveError } from "@proj/domain/accounts/errors/AccountInactiveError";
import { SameAccountTransferError } from "@proj/domain/accounts/errors/SameAccountTransferError";
import { InsufficientFundsError } from "@proj/domain/accounts/errors/InsufficientFundsError";
import { Result, err, ok } from "../Result";

type Input = {
    userId: string;
    sourceAccountId: string;
    destinationIban: string;
    amount: string;
    note?: string;
};
type TransferError =
    | InvalidTransferAmountError
    | AccountNotFoundError
    | AccountInactiveError
    | SameAccountTransferError
    | InsufficientFundsError
    | Error;

export class TransferBetweenAccountsUseCase {
    constructor(private readonly repo: TransferRepository) {}

    private toCents(value: string): Result<number, InvalidTransferAmountError> {
        const [intPart, decPart = ""] = value.split(".");
        const normalizedDec = (decPart + "00").slice(0, 2);
        const cents = Number(intPart) * 100 + Number(normalizedDec);
        if (!Number.isFinite(cents)) {
            return err(new InvalidTransferAmountError());
        }
        return ok(cents);
    }

    private formatCents(cents: number): string {
        const sign = cents < 0 ? "-" : "";
        const abs = Math.abs(cents);
        const euros = Math.floor(abs / 100);
        const decimals = (abs % 100).toString().padStart(2, "0");
        return `${sign}${euros}.${decimals}`;
    }

    private normalizeAmount(amount: string): Result<string, InvalidTransferAmountError> {
        const trimmed = amount.trim();
        const match = trimmed.match(/^\d+(\.\d{1,2})?$/);
        if (!match) {
            return err(new InvalidTransferAmountError());
        }
        const centsResult = this.toCents(trimmed);
        if (!centsResult.ok) return centsResult;
        if (centsResult.value <= 0) {
            return err(new InvalidTransferAmountError());
        }
        return ok(this.formatCents(centsResult.value));
    }

    private ensureAccountsValid(input: {
        userId: string;
        source: TransferAccount | null;
        destination: TransferAccount | null;
        amountCents: number;
    }): Result<void, TransferError> {
        const { userId, source, destination, amountCents } = input;
        if (!source || source.userId !== userId) {
            return err(new AccountNotFoundError());
        }
        if (!destination) {
            return err(new AccountNotFoundError());
        }
        if (source.id === destination.id) {
            return err(new SameAccountTransferError());
        }
        if (!source.isActive || !destination.isActive) {
            return err(new AccountInactiveError());
        }
        const sourceBalanceCentsResult = this.toCents(source.balance);
        if (!sourceBalanceCentsResult.ok) return sourceBalanceCentsResult;
        if (sourceBalanceCentsResult.value < amountCents) {
            return err(new InsufficientFundsError());
        }
        return ok(undefined);
    }

    async execute(input: Input): Promise<Result<TransferResult, TransferError>> {
        const normalizedAmountResult = this.normalizeAmount(input.amount ?? "");
        if (!normalizedAmountResult.ok) return err(normalizedAmountResult.error);

        const amountCentsResult = this.toCents(normalizedAmountResult.value);
        if (!amountCentsResult.ok) return err(amountCentsResult.error);

        const [source, destination] = await Promise.all([
            this.repo.findAccountById(input.sourceAccountId),
            this.repo.findAccountByIban(input.destinationIban.trim()),
        ]);

        const validation = this.ensureAccountsValid({
            userId: input.userId,
            source,
            destination,
            amountCents: amountCentsResult.value,
        });
        if (!validation.ok) return err(validation.error);

        try {
            const transfer = await this.repo.executeTransfer({
                sourceAccountId: input.sourceAccountId,
                destinationAccountId: destination!.id,
                amount: normalizedAmountResult.value,
                note: input.note?.trim(),
            });
            return ok(transfer);
        } catch (e: any) {
            return err(e instanceof Error ? e : new Error("TRANSFER_FAILED"));
        }
    }
}
