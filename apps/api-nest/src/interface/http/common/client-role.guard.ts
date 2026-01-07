import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { Request } from "express";
import { TokenVerifier } from "@proj/domain/auth/ports/TokenVerifier";
import { UserQueryRepository } from "@proj/domain/users/ports/UserQueryRepository";
import { UnauthorizedAccessError } from "@proj/domain/auth/errors/UnauthorizedAccessError";
import { ForbiddenRoleError } from "@proj/domain/auth/errors/ForbiddenRoleError";
import { BannedAccountError } from "@proj/domain/auth/errors/BannedAccountError";

@Injectable()
export class ClientRoleGuard implements CanActivate {
    constructor(
        @Inject("TokenVerifier") private readonly tokenVerifier: TokenVerifier,
        @Inject("UserQueryRepository") private readonly userRepo: UserQueryRepository,
    ) {}

    private extractSessionCookie(req: Request): string | null {
        const raw = req.headers?.cookie ?? "";
        const cookie = raw
            .split(";")
            .map((c) => c.trim())
            .find((c) => c.startsWith("session="));
        return cookie ? decodeURIComponent(cookie.replace("session=", "")) : null;
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest<Request>();
        const token = this.extractSessionCookie(req);
        if (!token) {
            throw new UnauthorizedAccessError();
        }

        const userId = await this.tokenVerifier.verify(token);
        if (!userId) {
            throw new UnauthorizedAccessError();
        }

        const access = await this.userRepo.getAccessById(userId);
        if (!access) {
            throw new UnauthorizedAccessError();
        }

        if (access.bannedAt) {
            throw new BannedAccountError();
        }

        if (access.role !== "CLIENT") {
            throw new ForbiddenRoleError();
        }

        return true;
    }
}
