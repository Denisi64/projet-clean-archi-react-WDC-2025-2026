import { Module } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { AuthController } from "./auth.controller";
import { LoginUserUseCase } from "../../../application/auth/LoginUserUseCase";
import { PrismaAuthRepository } from "../../../infrastructure/repositories/PrismaAuthRepository";
import { BcryptPasswordHasher } from "../../../infrastructure/services/BcryptPasswordHasher";
import { JwtTokenManager } from "../../../infrastructure/services/JwtTokenManager";
import { RegisterUserUseCase } from "../../../application/auth/RegisterUserUseCase";
import { NodemailerEmailService } from "../../../infrastructure/services/NodemailerEmailService";
import { ConfirmUserUseCase } from "../../../application/auth/ConfirmUserUseCase";
import { JwtTokenVerifier } from "@proj/infra/auth/JwtTokenVerifier";
import { PrismaUserQueryRepository } from "@proj/infra/users/PrismaUserQueryRepository";
import { GetUserProfileUseCase } from "@proj/application/users/GetUserProfileUseCase";

@Module({
    controllers: [AuthController],
    providers: [
        PrismaClient,
        {
            provide: "AuthRepository",
            useFactory: (prisma: PrismaClient) => new PrismaAuthRepository(prisma),
            inject: [PrismaClient],
        },
        {
            provide: "PasswordHasher",
            useClass: BcryptPasswordHasher,
        },
        {
            provide: "EmailService",
            useClass: NodemailerEmailService,
        },
        {
            provide: "TokenManager",
            useFactory: () => new JwtTokenManager(process.env.JWT_SECRET ?? "dev-secret"),
        },
        {
            provide: "TokenVerifier",
            useFactory: () => new JwtTokenVerifier(process.env.JWT_SECRET ?? "dev-secret"),
        },
        {
            provide: "CONFIRMATION_TOKEN_TTL_HOURS",
            useValue: Number(process.env.CONFIRMATION_TOKEN_TTL_HOURS ?? "24"),
        },
        {
            provide: "UserQueryRepository",
            useFactory: (prisma: PrismaClient) => new PrismaUserQueryRepository(prisma),
            inject: [PrismaClient],
        },
        {
            provide: LoginUserUseCase,
            useFactory: (repo, hasher, tokens) =>
                new LoginUserUseCase(repo, hasher, tokens),
            inject: ["AuthRepository", "PasswordHasher", "TokenManager"],
        },
        {
            provide: RegisterUserUseCase,
            useFactory: (repo, hasher, emailService, ttlHours) =>
                new RegisterUserUseCase(repo, hasher, emailService, ttlHours),
            inject: ["AuthRepository", "PasswordHasher", "EmailService", "CONFIRMATION_TOKEN_TTL_HOURS"],
        },
        {
            provide: ConfirmUserUseCase,
            useFactory: (repo) => new ConfirmUserUseCase(repo),
            inject: ["AuthRepository"],
        },
        {
            provide: GetUserProfileUseCase,
            useFactory: (repo) => new GetUserProfileUseCase(repo),
            inject: ["UserQueryRepository"],
        },
    ],
    exports: [LoginUserUseCase, RegisterUserUseCase, ConfirmUserUseCase],
})
export class AuthModule {}
