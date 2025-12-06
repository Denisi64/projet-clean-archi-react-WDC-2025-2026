export class SameAccountTransferError extends Error {
    constructor() {
        super("Cannot transfer to the same account");
        this.name = "SameAccountTransferError";
    }
}
