export class BannedAccountError extends Error {
    constructor() {
        super("ACCOUNT_BANNED");
        this.name = "BannedAccountError";
    }
}
