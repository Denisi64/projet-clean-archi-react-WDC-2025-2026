import jwt from "jsonwebtoken";
import { TokenVerifier } from "../../domain/auth/ports/TokenVerifier";

export class JwtTokenVerifier implements TokenVerifier {
    constructor(private readonly secret: string) {}

    async verify(token: string): Promise<string | null> {
        try {
            const payload = jwt.verify(token, this.secret) as any;
            const subject = payload?.sub;
            return typeof subject === "string" ? subject : null;
        } catch {
            return null;
        }
    }
}
