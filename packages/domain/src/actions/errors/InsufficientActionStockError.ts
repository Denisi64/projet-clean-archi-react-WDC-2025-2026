export class InsufficientActionStockError extends Error {
    constructor() {
        super("INSUFFICIENT_ACTION_STOCK");
        this.name = "InsufficientActionStockError";
    }
}
