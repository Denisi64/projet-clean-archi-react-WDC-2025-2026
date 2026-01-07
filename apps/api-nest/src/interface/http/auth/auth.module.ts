import { Module } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { AuthController } from "./auth.controller";
import { LoginUserUseCase } from "@proj/application/auth/LoginUserUseCase";
import { RegisterUserUseCase } from "@proj/application/auth/RegisterUserUseCase";
import { ConfirmUserUseCase } from "@proj/application/auth/ConfirmUserUseCase";
import { GetUserProfileUseCase } from "@proj/application/users/GetUserProfileUseCase";
import { PrismaAuthRepository } from "@proj/infra/auth/PrismaAuthRepository";
import { BcryptPasswordHasher } from "@proj/infra/auth/BcryptPasswordHasher";
import { JwtTokenManager } from "@proj/infra/auth/JwtTokenManager";
import { NodemailerEmailService } from "@proj/infra/auth/NodemailerEmailService";
import { CryptoActivationTokenGenerator } from "@proj/infra/auth/CryptoActivationTokenGenerator";
import { JwtTokenVerifier } from "@proj/infra/auth/JwtTokenVerifier";
import { PrismaUserQueryRepository } from "@proj/infra/users/PrismaUserQueryRepository";

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
            provide: "ActivationTokenGenerator",
            useClass: CryptoActivationTokenGenerator,
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
            useFactory: (repo, hasher, emailService, tokenGenerator, ttlHours) =>
                new RegisterUserUseCase(repo, hasher, emailService, tokenGenerator, ttlHours),
            inject: [
                "AuthRepository",
                "PasswordHasher",
                "EmailService",
                "ActivationTokenGenerator",
                "CONFIRMATION_TOKEN_TTL_HOURS",
            ],
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
