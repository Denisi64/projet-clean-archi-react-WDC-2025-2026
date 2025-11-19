import * as jwt from "jsonwebtoken";
import { TokenManager } from "../../domain/auth/ports/TokenManager";

export class JwtTokenManager implements TokenManager {
    constructor(private secret: string) {}
    async issue(payload: Record<string, string>, opts: { expiresIn: string }) {
        return jwt.sign(payload, this.secret, { expiresIn: opts.expiresIn });
    }
}
