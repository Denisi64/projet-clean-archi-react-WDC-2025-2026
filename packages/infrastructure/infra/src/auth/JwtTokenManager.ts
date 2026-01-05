// apps/api-nest/src/infrastructure/services/JwtTokenManager.ts
import { sign, Secret, SignOptions } from "jsonwebtoken";
import { TokenManager } from "@proj/domain/auth/ports/TokenManager";

export class JwtTokenManager implements TokenManager {
    constructor(private readonly secret: Secret) {}

    async issue(payload: Record<string, string>, opts: { expiresIn: string }): Promise<string> {
        const options: SignOptions = { expiresIn: opts.expiresIn as SignOptions["expiresIn"] };
        return sign(payload, this.secret, options);
    }
}
