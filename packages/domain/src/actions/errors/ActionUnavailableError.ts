export class ActionUnavailableError extends Error {
    constructor() {
        super("ACTION_UNAVAILABLE");
        this.name = "ActionUnavailableError";
    }
}
