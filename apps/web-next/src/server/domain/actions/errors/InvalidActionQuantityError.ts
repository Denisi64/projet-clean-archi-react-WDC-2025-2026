export class InvalidActionQuantityError extends Error {
    constructor() {
        super("INVALID_ACTION_QUANTITY");
        this.name = "InvalidActionQuantityError";
    }
}
