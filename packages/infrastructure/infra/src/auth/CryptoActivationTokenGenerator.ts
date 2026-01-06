import { randomBytes } from "crypto";
import { ActivationTokenGenerator } from "@proj/domain/auth/ports/ActivationTokenGenerator";

export class CryptoActivationTokenGenerator implements ActivationTokenGenerator {
    async generate(): Promise<string> {
        return randomBytes(32).toString("hex");
    }
}
