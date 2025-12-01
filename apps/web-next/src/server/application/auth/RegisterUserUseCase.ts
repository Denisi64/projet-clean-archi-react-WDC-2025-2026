// src/server/application/auth/RegisterUserUseCase.ts

import { randomBytes } from "crypto";
import { AuthRepository } from "../../domain/auth/ports/AuthRepository";
import { PasswordHasher } from "../../domain/auth/ports/PasswordHasher";
import { EmailAlreadyInUseError } from "../../domain/auth/errors/EmailAlreadyInUseError";
import { EmailService } from "../../domain/auth/ports/EmailService";

type Input = { email: string; password: string; name?: string };
type Output = { success: true; expiresAt: Date };

export class RegisterUserUseCase {
    constructor(
        private readonly repo: AuthRepository,
        private readonly hasher: PasswordHasher,
        private readonly emailService: EmailService,
        private readonly ttlHours: number,
    ) {}

    async execute({ email, password, name }: Input): Promise<Output> {
        const existing = await this.repo.findByEmail(email);
        if (existing) {
            throw new EmailAlreadyInUseError(email);
        }

        const passwordHash = await this.hasher.hash(password);
        const token = randomBytes(32).toString("hex");
        const hours = Number.isFinite(this.ttlHours) ? this.ttlHours : 24;
        const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
        const displayName = name?.trim() || email.split("@")[0];

        await this.repo.createUser({
            email,
            passwordHash,
            name: displayName,
            isActive: false,
            confirmationToken: token,
            confirmationTokenExpiresAt: expiresAt,
        });

        await this.emailService.sendConfirmationEmail(email, token);

        return { success: true, expiresAt };
    }
}
