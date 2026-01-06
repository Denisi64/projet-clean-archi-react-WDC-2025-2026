export class ActionNotFoundError extends Error {
    constructor() {
        super("ACTION_NOT_FOUND");
        this.name = "ActionNotFoundError";
    }
}
