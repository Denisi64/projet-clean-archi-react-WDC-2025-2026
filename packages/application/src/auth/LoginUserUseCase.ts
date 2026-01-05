// apps/api-nest/src/application/auth/LoginUserUseCase.ts
import { AuthRepository } from "@proj/domain/auth/ports/AuthRepository";
import { PasswordHasher } from "@proj/domain/auth/ports/PasswordHasher";
import { TokenManager } from "@proj/domain/auth/ports/TokenManager";
import { InvalidCredentialsError } from "@proj/domain/auth/errors/InvalidCredentialsError";
import { InactiveAccountError } from "@proj/domain/auth/errors/InactiveAccountError";
import { BannedAccountError } from "@proj/domain/auth/errors/BannedAccountError";
import { Result, err, ok } from "../Result";

type Input = { email: string; password: string; remember?: boolean };
type Output = { token: string; userId: string; ttl: number };
type LoginError = InvalidCredentialsError | InactiveAccountError | BannedAccountError | Error;

export class LoginUserUseCase {
    constructor(
        private readonly repo: AuthRepository,
        private readonly hasher: PasswordHasher,
        private readonly tokens: TokenManager,
    ) {}

    async execute({ email, password, remember }: Input): Promise<Result<Output, LoginError>> {
        const user = await this.repo.findByEmail(email);
        if (!user) {
            return err(new InvalidCredentialsError());
        }

        const isValid = await this.hasher.compare(password, user.passwordHash);
        if (!isValid) {
            return err(new InvalidCredentialsError());
        }

        if (user.bannedAt) {
            return err(new BannedAccountError());
        }

        if (!user.isActive) {
            return err(new InactiveAccountError());
        }

        const expiresIn = remember ? "30d" : "1d";
        try {
            const token = await this.tokens.issue({ sub: user.id }, { expiresIn });
            const ttl = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24; // secondes
            return ok({ token, userId: user.id, ttl });
        } catch (e: any) {
            return err(e instanceof Error ? e : new Error("TOKEN_ISSUE_FAILED"));
        }
    }
}
