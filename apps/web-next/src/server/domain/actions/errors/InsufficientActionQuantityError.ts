export class InsufficientActionQuantityError extends Error {
    constructor() {
        super("INSUFFICIENT_ACTION_QUANTITY");
        this.name = "InsufficientActionQuantityError";
    }
}
