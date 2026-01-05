export class InsufficientFundsError extends Error {
    constructor() {
        super("INSUFFICIENT_FUNDS");
    }
}
