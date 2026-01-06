export class InvalidCreditRepaymentError extends Error {
    constructor() {
        super("INVALID_CREDIT_REPAYMENT");
        this.name = "InvalidCreditRepaymentError";
    }
}
