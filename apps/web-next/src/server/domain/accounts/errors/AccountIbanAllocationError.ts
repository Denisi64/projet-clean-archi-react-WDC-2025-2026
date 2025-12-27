export class AccountIbanAllocationError extends Error {
    constructor() {
        super("ACCOUNT_IBAN_ALLOCATION_FAILED");
        this.name = "AccountIbanAllocationError";
    }
}
