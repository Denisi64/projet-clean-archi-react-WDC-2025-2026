export class InvalidActionInputError extends Error {
    constructor() {
        super("INVALID_ACTION_INPUT");
        this.name = "InvalidActionInputError";
    }
}
