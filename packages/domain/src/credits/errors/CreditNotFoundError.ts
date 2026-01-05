export class CreditNotFoundError extends Error {
    constructor() {
        super("Credit not found");
        this.name = "CreditNotFoundError";
    }
}
