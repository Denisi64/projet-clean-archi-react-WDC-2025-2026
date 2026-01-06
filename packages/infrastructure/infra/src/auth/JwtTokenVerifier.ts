import { Secret, verify } from "jsonwebtoken";
import { TokenVerifier } from "@proj/domain/auth/ports/TokenVerifier";

export class JwtTokenVerifier implements TokenVerifier {
    constructor(private readonly secret: Secret) {}

    async verify(token: string): Promise<string | null> {
        try {
            const payload = verify(token, this.secret) as { sub?: unknown };
            const subject = payload?.sub;
            return typeof subject === "string" ? subject : null;
        } catch {
            return null;
        }
    }
}
