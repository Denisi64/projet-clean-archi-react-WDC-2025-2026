export class AccountInactiveError extends Error {
    constructor() {
        super("ACCOUNT_INACTIVE");
    }
}
