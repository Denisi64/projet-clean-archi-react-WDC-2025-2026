export class ExpiredConfirmationTokenError extends Error {
    readonly name = "ExpiredConfirmationTokenError";

    constructor() {
        super("CONFIRMATION_TOKEN_EXPIRED");
    }
}
