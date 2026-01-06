export class SameAccountTransferError extends Error {
    constructor() {
        super("SAME_ACCOUNT_TRANSFER");
    }
}
