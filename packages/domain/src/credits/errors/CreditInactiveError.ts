export class CreditInactiveError extends Error {
    constructor() {
        super("Credit is not active");
        this.name = "CreditInactiveError";
    }
}
