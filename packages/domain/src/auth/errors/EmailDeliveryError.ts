export class EmailDeliveryError extends Error {
    readonly name = "EmailDeliveryError";

    constructor(public readonly reason?: string) {
        super("EMAIL_DELIVERY_FAILED");
    }
}
