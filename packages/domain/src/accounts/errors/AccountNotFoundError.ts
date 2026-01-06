export class AccountNotFoundError extends Error {
    constructor() {
        super("ACCOUNT_NOT_FOUND");
    }
}
