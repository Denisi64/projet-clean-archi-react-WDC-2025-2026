import { TokenVerifier } from "@proj/domain/auth/ports/TokenVerifier";
import { UserQueryRepository, UserRole } from "@proj/domain/users/ports/UserQueryRepository";
import { UnauthorizedAccessError } from "@proj/domain/auth/errors/UnauthorizedAccessError";
import { ForbiddenRoleError } from "@proj/domain/auth/errors/ForbiddenRoleError";
import { BannedAccountError } from "@proj/domain/auth/errors/BannedAccountError";
import { Result, err, ok } from "../Result";

type Input = { token: string | null | undefined; requiredRoles?: UserRole[] };
type Output = { userId: string; role: UserRole };
type RoleError = UnauthorizedAccessError | ForbiddenRoleError | BannedAccountError | Error;

export class GetUserRoleFromTokenUseCase {
    constructor(
        private readonly tokenVerifier: TokenVerifier,
        private readonly userRepo: UserQueryRepository,
    ) {}

    async execute({ token, requiredRoles }: Input): Promise<Result<Output, RoleError>> {
        if (!token) return err(new UnauthorizedAccessError());

        const userId = await this.tokenVerifier.verify(token);
        if (!userId) return err(new UnauthorizedAccessError());

        const access = await this.userRepo.getAccessById(userId);
        if (!access) return err(new UnauthorizedAccessError());

        if (access.bannedAt) {
            return err(new BannedAccountError());
        }

        if (requiredRoles && !requiredRoles.includes(access.role)) {
            return err(new ForbiddenRoleError());
        }

        return ok({ userId, role: access.role });
    }
}
