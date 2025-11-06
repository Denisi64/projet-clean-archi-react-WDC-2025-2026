import { AuthRepository } from "../../domain/auth/ports/AuthRepository";
import { PasswordHasher } from "../../domain/auth/ports/PasswordHasher";
import { TokenManager } from "../../domain/auth/ports/TokenManager";
import { InvalidCredentialsError } from "../../domain/auth/errors/InvalidCredentialsError";

type Input = { email: string; password: string; remember?: boolean };
type Output = { token: string; userId: string; ttl: number };

export class LoginUserUseCase {
    constructor(
        private repo: AuthRepository,
        private hasher: PasswordHasher,
        private tokens: TokenManager
    ) {}

    async execute({ email, password, remember }: Input): Promise<Output> {
        const user = await this.repo.findByEmail(email);
        if (!user) throw new InvalidCredentialsError();

        const ok = await this.hasher.compare(password, user.passwordHash);
        if (!ok) throw new InvalidCredentialsError();

        const expiresIn = remember ? "30d" : "1d";
        const token = await this.tokens.issue({ sub: user.id }, { expiresIn });
        const ttl = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24; // sec
        return { token, userId: user.id, ttl };
    }
}