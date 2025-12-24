export class UnauthorizedAccessError extends Error {
    constructor() {
        super("UNAUTHORIZED");
        this.name = "UnauthorizedAccessError";
    }
}
