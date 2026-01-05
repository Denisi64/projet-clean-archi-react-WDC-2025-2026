export class InvalidCreditAmountError extends Error {
    constructor() {
        super("INVALID_CREDIT_AMOUNT");
        this.name = "InvalidCreditAmountError";
    }
}
