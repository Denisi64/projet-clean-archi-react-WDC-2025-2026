import * as bcrypt from "bcrypt";
import { PasswordHasher } from "../domain/auth/ports/PasswordHasher";

export class BcryptPasswordHasher implements PasswordHasher {
    compare(plain: string, hash: string) {
        return bcrypt.compare(plain, hash);
    }
}
