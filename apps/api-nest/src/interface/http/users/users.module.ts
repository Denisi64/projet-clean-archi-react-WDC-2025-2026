import { Module } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { SearchUsersUseCase } from "@proj/application/users/SearchUsersUseCase";
import { JwtTokenVerifier } from "@proj/infra/auth/JwtTokenVerifier";
import { AdvisorRoleGuard } from "../common/advisor-role.guard";
import { createUserQueryRepository } from "@proj/infra";

@Module({
    controllers: [UsersController],
    providers: [
        {
            provide: "TokenVerifier",
            useFactory: () => new JwtTokenVerifier(process.env.JWT_SECRET ?? "dev-secret"),
        },
        {
            provide: "UserQueryRepository",
            useFactory: () => createUserQueryRepository(),
        },
        {
            provide: SearchUsersUseCase,
            useFactory: (repo) => new SearchUsersUseCase(repo),
            inject: ["UserQueryRepository"],
        },
        AdvisorRoleGuard,
    ],
})
export class UsersModule {}
