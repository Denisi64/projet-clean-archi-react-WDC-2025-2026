export class ActionInUseError extends Error {
    constructor() {
        super("ACTION_IN_USE");
        this.name = "ActionInUseError";
    }
}
