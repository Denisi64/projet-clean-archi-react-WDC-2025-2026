export class InvalidTransferAmountError extends Error {
    constructor() {
        super("Invalid transfer amount");
        this.name = "InvalidTransferAmountError";
    }
}
