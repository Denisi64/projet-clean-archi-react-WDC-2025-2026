export class EmailAlreadyInUseError extends Error {
    readonly name = "EmailAlreadyInUseError";

    constructor(public readonly email: string) {
        super(`Email already in use: ${email}`);
    }
}
