import { AuthRepository } from "@proj/domain/auth/ports/AuthRepository";
import { InvalidConfirmationTokenError } from "@proj/domain/auth/errors/InvalidConfirmationTokenError";
import { ExpiredConfirmationTokenError } from "@proj/domain/auth/errors/ExpiredConfirmationTokenError";
import { Result, err, ok } from "../Result";

type Output = { userId: string };
type ConfirmError = InvalidConfirmationTokenError | ExpiredConfirmationTokenError | Error;

export class ConfirmUserUseCase {
    constructor(private readonly repo: AuthRepository) {}

    async execute(token: string): Promise<Result<Output, ConfirmError>> {
        try {
            const user = await this.repo.findByConfirmationToken(token);
            if (!user || !user.confirmationTokenExpiresAt) {
                return err(new InvalidConfirmationTokenError());
            }

            if (user.isActive) {
                await this.repo.confirmUser(user.id);
                return ok({ userId: user.id });
            }

            if (user.confirmationTokenExpiresAt.getTime() < Date.now()) {
                return err(new ExpiredConfirmationTokenError());
            }

            await this.repo.confirmUser(user.id);
            return ok({ userId: user.id });
        } catch (e: any) {
            return err(e instanceof Error ? e : new Error("CONFIRM_FAILED"));
        }
    }
}
