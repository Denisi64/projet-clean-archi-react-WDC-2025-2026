export class InvalidConfirmationTokenError extends Error {
    readonly name = "InvalidConfirmationTokenError";

    constructor() {
        super("CONFIRMATION_TOKEN_INVALID");
    }
}
