// apps/api-nest/src/interface/http/common/domain-exception.filter.ts
import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from "@nestjs/common";
import { InvalidCredentialsError } from "../../../domain/auth/errors/InvalidCredentialsError";
import { EmailAlreadyInUseError } from "../../../domain/auth/errors/EmailAlreadyInUseError";
import { InactiveAccountError } from "../../../domain/auth/errors/InactiveAccountError";
import { InvalidConfirmationTokenError } from "../../../domain/auth/errors/InvalidConfirmationTokenError";
import { ExpiredConfirmationTokenError } from "../../../domain/auth/errors/ExpiredConfirmationTokenError";
import { EmailDeliveryError } from "../../../domain/auth/errors/EmailDeliveryError";

@Catch(Error)
export class DomainExceptionFilter implements ExceptionFilter {
    catch(exception: Error, host: ArgumentsHost) {
        const res = host.switchToHttp().getResponse();

        if (exception instanceof InvalidCredentialsError) {
            return res.status(HttpStatus.UNAUTHORIZED).json({ code: "INVALID_CREDENTIALS" });
        }
        if (exception instanceof InactiveAccountError) {
            return res.status(HttpStatus.FORBIDDEN).json({ code: "ACCOUNT_INACTIVE" });
        }
        if (exception instanceof EmailAlreadyInUseError) {
            return res.status(HttpStatus.CONFLICT).json({ code: "EMAIL_ALREADY_USED" });
        }
        if (exception instanceof InvalidConfirmationTokenError) {
            return res.status(HttpStatus.BAD_REQUEST).json({ code: "CONFIRMATION_TOKEN_INVALID" });
        }
        if (exception instanceof ExpiredConfirmationTokenError) {
            return res.status(HttpStatus.GONE).json({ code: "CONFIRMATION_TOKEN_EXPIRED" });
        }
        if (exception instanceof EmailDeliveryError) {
            return res.status(HttpStatus.BAD_GATEWAY).json({ code: "EMAIL_DELIVERY_FAILED" });
        }

        console.error("[Nest] Unexpected error:", exception.name, exception.message);
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ code: "UNEXPECTED_ERROR" });
    }
}
