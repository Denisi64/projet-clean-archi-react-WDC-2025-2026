import { TokenVerifier } from "../../domain/auth/ports/TokenVerifier";
import { UserQueryRepository, UserRole } from "../../domain/users/ports/UserQueryRepository";
import { UnauthorizedAccessError } from "../../domain/auth/errors/UnauthorizedAccessError";
import { ForbiddenRoleError } from "../../domain/auth/errors/ForbiddenRoleError";

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

        const role = await this.userRepo.getRoleById(userId);
        if (!role) throw new UnauthorizedAccessError();

        if (requiredRoles && !requiredRoles.includes(role)) {
            throw new ForbiddenRoleError();
        }

        return { userId, role };
    }
}
