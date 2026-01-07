import { Module } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { AdminUsersController } from "./admin-users.controller";
import { PrismaUserQueryRepository } from "@proj/infra/users/PrismaUserQueryRepository";
import { PrismaUserAdminRepository } from "@proj/infra/users/PrismaUserAdminRepository";
import { SearchUsersUseCase } from "@proj/application/users/SearchUsersUseCase";
import { BanUserUseCase } from "@proj/application/users/BanUserUseCase";
import { JwtTokenVerifier } from "@proj/infra/auth/JwtTokenVerifier";
import { DirectorRoleGuard } from "../common/director-role.guard";

@Module({
    controllers: [AdminUsersController],
    providers: [
        PrismaClient,
        {
            provide: "TokenVerifier",
            useFactory: () => new JwtTokenVerifier(process.env.JWT_SECRET ?? "dev-secret"),
        },
        {
            provide: "UserQueryRepository",
            useFactory: (prisma: PrismaClient) => new PrismaUserQueryRepository(prisma),
            inject: [PrismaClient],
        },
        {
            provide: "UserAdminRepository",
            useFactory: (prisma: PrismaClient) => new PrismaUserAdminRepository(prisma),
            inject: [PrismaClient],
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
