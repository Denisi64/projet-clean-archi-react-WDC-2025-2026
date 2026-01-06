export class InvalidCreditInputError extends Error {
    constructor() {
        super("INVALID_CREDIT_INPUT");
        this.name = "InvalidCreditInputError";
    }
}
