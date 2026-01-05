export class ForbiddenRoleError extends Error {
    constructor() {
        super("FORBIDDEN");
        this.name = "ForbiddenRoleError";
    }
}
