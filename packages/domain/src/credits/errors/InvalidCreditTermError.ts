export class InvalidCreditTermError extends Error {
    constructor() {
        super("INVALID_CREDIT_TERM");
        this.name = "InvalidCreditTermError";
    }
}
