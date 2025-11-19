// src/server/application/auth/RegisterUserUseCase.ts

import { AuthRepository } from "../../domain/auth/ports/AuthRepository";
import { PasswordHasher } from "../../domain/auth/ports/PasswordHasher";
import { TokenManager } from "../../domain/auth/ports/TokenManager";
import { EmailAlreadyInUseError } from "../../domain/auth/errors/EmailAlreadyInUseError";

type Input = {
    email: string;
    password: string;
    remember?: boolean;
};

type Output = { token: string; userId: string; ttl: number };

export class RegisterUserUseCase {
    constructor(
        private repo: AuthRepository,
        private hasher: PasswordHasher,
        private tokens: TokenManager
    ) {}

    async execute({ email, password, remember }: Input): Promise<Output> {
        const existing = await this.repo.findByEmail(email);
        if (existing) {
            throw new EmailAlreadyInUseError(email);
        }

        const passwordHash = await this.hasher.hash(password);

        const created = await this.repo.createUser({
            email,
            passwordHash,
        });

        const expiresIn = remember ? "30d" : "1d";
        const token = await this.tokens.issue({ sub: created.id }, { expiresIn });
        const ttl = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24;

        return { token, userId: created.id, ttl };
    }
}
