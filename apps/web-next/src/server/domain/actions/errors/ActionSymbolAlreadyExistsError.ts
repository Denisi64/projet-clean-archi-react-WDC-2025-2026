export class ActionSymbolAlreadyExistsError extends Error {
    constructor() {
        super("ACTION_SYMBOL_ALREADY_EXISTS");
        this.name = "ActionSymbolAlreadyExistsError";
    }
}
