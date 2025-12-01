import { AuthRepository } from "../../domain/auth/ports/AuthRepository";
import { InvalidConfirmationTokenError } from "../../domain/auth/errors/InvalidConfirmationTokenError";
import { ExpiredConfirmationTokenError } from "../../domain/auth/errors/ExpiredConfirmationTokenError";

type Output = { userId: string };

export class ConfirmUserUseCase {
    constructor(private readonly repo: AuthRepository) {}

    async execute(token: string): Promise<Output> {
        const user = await this.repo.findByConfirmationToken(token);
        if (!user || !user.confirmationTokenExpiresAt) {
            throw new InvalidConfirmationTokenError();
        }

        if (user.isActive) {
            await this.repo.confirmUser(user.id);
            return { userId: user.id };
        }

        if (user.confirmationTokenExpiresAt.getTime() < Date.now()) {
            throw new ExpiredConfirmationTokenError();
        }

        await this.repo.confirmUser(user.id);
        return { userId: user.id };
    }
}
