import { AuthRepository } from "@proj/domain/auth/ports/AuthRepository";
import { PasswordHasher } from "@proj/domain/auth/ports/PasswordHasher";
import { EmailAlreadyInUseError } from "@proj/domain/auth/errors/EmailAlreadyInUseError";
import { EmailService } from "@proj/domain/auth/ports/EmailService";
import { ActivationTokenGenerator } from "@proj/domain/auth/ports/ActivationTokenGenerator";
import { Result, err, ok } from "../Result";

type Input = { email: string; password: string; name?: string };
type Output = { success: true; expiresAt: Date };
type RegisterError = EmailAlreadyInUseError | Error;

export class RegisterUserUseCase {
    constructor(
        private readonly repo: AuthRepository,
        private readonly hasher: PasswordHasher,
        private readonly emailService: EmailService,
        private readonly tokenGenerator: ActivationTokenGenerator,
        private readonly ttlHours: number,
    ) {}

    async execute({ email, password, name }: Input): Promise<Result<Output, RegisterError>> {
        const existing = await this.repo.findByEmail(email);
        if (existing) {
            return err(new EmailAlreadyInUseError(email));
        }

        const passwordHash = await this.hasher.hash(password);

        const token = await this.tokenGenerator.generate();
        const hours = Number.isFinite(this.ttlHours) ? this.ttlHours : 24;
        const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
        const displayName = name?.trim() || email.split("@")[0];

        try {
            await this.repo.createUser({
                email,
                passwordHash,
                name: displayName,
                isActive: false,
                confirmationToken: token,
                confirmationTokenExpiresAt: expiresAt,
            });

            await this.emailService.sendConfirmationEmail(email, token);
        } catch (e: any) {
            return err(e instanceof Error ? e : new Error("REGISTER_FAILED"));
        }

        return ok({ success: true, expiresAt });
    }
}
