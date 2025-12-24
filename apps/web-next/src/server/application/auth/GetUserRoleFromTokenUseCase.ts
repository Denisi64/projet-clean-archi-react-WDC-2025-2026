import { TokenVerifier } from "../../domain/auth/ports/TokenVerifier";
import { UserQueryRepository, UserRole } from "../../domain/users/ports/UserQueryRepository";
import { UnauthorizedAccessError } from "../../domain/auth/errors/UnauthorizedAccessError";
import { ForbiddenRoleError } from "../../domain/auth/errors/ForbiddenRoleError";
import { BannedAccountError } from "../../domain/auth/errors/BannedAccountError";

type Input = { token: string | null | undefined; requiredRoles?: UserRole[] };
type Output = { userId: string; role: UserRole };

export class GetUserRoleFromTokenUseCase {
    constructor(
        private readonly tokenVerifier: TokenVerifier,
        private readonly userRepo: UserQueryRepository,
    ) {}

    async execute({ token, requiredRoles }: Input): Promise<Output> {
        if (!token) throw new UnauthorizedAccessError();

        const userId = await this.tokenVerifier.verify(token);
        if (!userId) throw new UnauthorizedAccessError();

        const access = await this.userRepo.getAccessById(userId);
        if (!access) throw new UnauthorizedAccessError();

        if (access.bannedAt) {
            throw new BannedAccountError();
        }

        if (requiredRoles && !requiredRoles.includes(access.role)) {
            throw new ForbiddenRoleError();
        }

        return { userId, role: access.role };
    }
}
