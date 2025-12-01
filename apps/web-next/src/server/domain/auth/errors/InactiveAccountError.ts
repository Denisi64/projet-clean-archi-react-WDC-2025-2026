export class InactiveAccountError extends Error {
    readonly name = "InactiveAccountError";

    constructor() {
        super("ACCOUNT_INACTIVE");
    }
}
