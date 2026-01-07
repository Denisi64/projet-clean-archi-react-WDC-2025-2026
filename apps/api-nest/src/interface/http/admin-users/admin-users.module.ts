import { Module } from "@nestjs/common";
import { AdminUsersController } from "./admin-users.controller";
import { SearchUsersUseCase } from "@proj/application/users/SearchUsersUseCase";
import { BanUserUseCase } from "@proj/application/users/BanUserUseCase";
import { JwtTokenVerifier } from "@proj/infra/auth/JwtTokenVerifier";
import { DirectorRoleGuard } from "../common/director-role.guard";
import { createUserAdminRepository, createUserQueryRepository } from "@proj/infra";

@Module({
    controllers: [AdminUsersController],
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
            provide: "UserAdminRepository",
            useFactory: () => createUserAdminRepository(),
        },
        {
            provide: SearchUsersUseCase,
            useFactory: (repo) => new SearchUsersUseCase(repo),
            inject: ["UserQueryRepository"],
        },
        {
            provide: BanUserUseCase,
            useFactory: (repo) => new BanUserUseCase(repo),
            inject: ["UserAdminRepository"],
        },
        DirectorRoleGuard,
    ],
})
export class AdminUsersModule {}
