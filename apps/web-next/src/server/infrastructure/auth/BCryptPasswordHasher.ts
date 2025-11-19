import bcrypt from "bcrypt";
import { PasswordHasher } from "../../domain/auth/ports/PasswordHasher";

export class BCryptPasswordHasher implements PasswordHasher {
    async hash(plain: string): Promise<string> {
        const saltRounds = 10;
        return bcrypt.hash(plain, saltRounds);
    }
    async compare(plain: string, hash: string): Promise<boolean> {
        return bcrypt.compare(plain, hash);
    }
}
