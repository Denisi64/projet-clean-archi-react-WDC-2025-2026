// apps/api-nest/src/interface/http/common/domain-exception.filter.ts
import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from "@nestjs/common";
import { InvalidCredentialsError as SharedInvalidCredentialsError } from "@proj/domain/auth/errors/InvalidCredentialsError";
import { EmailAlreadyInUseError as SharedEmailAlreadyInUseError } from "@proj/domain/auth/errors/EmailAlreadyInUseError";
import { InactiveAccountError as SharedInactiveAccountError } from "@proj/domain/auth/errors/InactiveAccountError";
import { InvalidConfirmationTokenError as SharedInvalidConfirmationTokenError } from "@proj/domain/auth/errors/InvalidConfirmationTokenError";
import { ExpiredConfirmationTokenError as SharedExpiredConfirmationTokenError } from "@proj/domain/auth/errors/ExpiredConfirmationTokenError";
import { EmailDeliveryError as SharedEmailDeliveryError } from "@proj/domain/auth/errors/EmailDeliveryError";
import { UnauthorizedAccessError } from "@proj/domain/auth/errors/UnauthorizedAccessError";
import { ForbiddenRoleError } from "@proj/domain/auth/errors/ForbiddenRoleError";
import { BannedAccountError } from "@proj/domain/auth/errors/BannedAccountError";
import { InvalidCredentialsError as LegacyInvalidCredentialsError } from "../../../domain/auth/errors/InvalidCredentialsError";
import { EmailAlreadyInUseError as LegacyEmailAlreadyInUseError } from "../../../domain/auth/errors/EmailAlreadyInUseError";
import { InactiveAccountError as LegacyInactiveAccountError } from "../../../domain/auth/errors/InactiveAccountError";
import { InvalidConfirmationTokenError as LegacyInvalidConfirmationTokenError } from "../../../domain/auth/errors/InvalidConfirmationTokenError";
import { ExpiredConfirmationTokenError as LegacyExpiredConfirmationTokenError } from "../../../domain/auth/errors/ExpiredConfirmationTokenError";
import { EmailDeliveryError as LegacyEmailDeliveryError } from "../../../domain/auth/errors/EmailDeliveryError";

@Catch(Error)
export class DomainExceptionFilter implements ExceptionFilter {
    catch(exception: Error, host: ArgumentsHost) {
        const res = host.switchToHttp().getResponse();

        if (exception instanceof SharedInvalidCredentialsError || exception instanceof LegacyInvalidCredentialsError) {
            return res.status(HttpStatus.UNAUTHORIZED).json({ code: "INVALID_CREDENTIALS" });
        }
        if (exception instanceof SharedInactiveAccountError || exception instanceof LegacyInactiveAccountError) {
            return res.status(HttpStatus.FORBIDDEN).json({ code: "ACCOUNT_INACTIVE" });
        }
        if (exception instanceof SharedEmailAlreadyInUseError || exception instanceof LegacyEmailAlreadyInUseError) {
            return res.status(HttpStatus.CONFLICT).json({ code: "EMAIL_ALREADY_USED" });
        }
        if (exception instanceof SharedInvalidConfirmationTokenError || exception instanceof LegacyInvalidConfirmationTokenError) {
            return res.status(HttpStatus.BAD_REQUEST).json({ code: "CONFIRMATION_TOKEN_INVALID" });
        }
        if (exception instanceof SharedExpiredConfirmationTokenError || exception instanceof LegacyExpiredConfirmationTokenError) {
            return res.status(HttpStatus.GONE).json({ code: "CONFIRMATION_TOKEN_EXPIRED" });
        }
        if (exception instanceof SharedEmailDeliveryError || exception instanceof LegacyEmailDeliveryError) {
            return res.status(HttpStatus.BAD_GATEWAY).json({ code: "EMAIL_DELIVERY_FAILED" });
        }
        if (exception instanceof UnauthorizedAccessError) {
            return res.status(HttpStatus.UNAUTHORIZED).json({ code: "UNAUTHORIZED" });
        }
        if (exception instanceof ForbiddenRoleError) {
            return res.status(HttpStatus.FORBIDDEN).json({ code: "FORBIDDEN" });
        }
        if (exception instanceof BannedAccountError) {
            return res.status(HttpStatus.FORBIDDEN).json({ code: "ACCOUNT_BANNED" });
        }

        console.error("[Nest] Unexpected error:", exception.name, exception.message);
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ code: "UNEXPECTED_ERROR" });
    }
}
