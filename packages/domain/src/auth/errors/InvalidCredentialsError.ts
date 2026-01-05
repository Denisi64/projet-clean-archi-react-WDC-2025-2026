// apps/api-nest/src/domain/auth/errors/InvalidCredentialsError.ts
export class InvalidCredentialsError extends Error {
    constructor() {
        super("INVALID_CREDENTIALS");
    }
}
