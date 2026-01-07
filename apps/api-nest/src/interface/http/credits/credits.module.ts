import { Module } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { CreditsController } from "./credits.controller";
import { ClientCreditsController } from "./client-credits.controller";
import { GrantCreditUseCase } from "@proj/application/credits/GrantCreditUseCase";
import { PrismaCreditRepository } from "@proj/infra/credits/PrismaCreditRepository";
import { RepayCreditUseCase } from "@proj/application/credits/RepayCreditUseCase";
import { ListCreditsForUserUseCase } from "@proj/application/credits/ListCreditsForUserUseCase";
import { JwtTokenVerifier } from "@proj/infra/auth/JwtTokenVerifier";
import { PrismaUserQueryRepository } from "@proj/infra/users/PrismaUserQueryRepository";
import { AdvisorRoleGuard } from "../common/advisor-role.guard";
import { ClientRoleGuard } from "../common/client-role.guard";

@Module({
    controllers: [CreditsController, ClientCreditsController],
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
            provide: "CreditRepository",
            useFactory: (prisma: PrismaClient) => new PrismaCreditRepository(prisma),
            inject: [PrismaClient],
        },
        {
            provide: GrantCreditUseCase,
            useFactory: (repo) => new GrantCreditUseCase(repo),
            inject: ["CreditRepository"],
        },
        {
            provide: RepayCreditUseCase,
            useFactory: (repo) => new RepayCreditUseCase(repo),
            inject: ["CreditRepository"],
        },
        {
            provide: ListCreditsForUserUseCase,
            useFactory: (repo) => new ListCreditsForUserUseCase(repo),
            inject: ["CreditRepository"],
        },
        AdvisorRoleGuard,
        ClientRoleGuard,
    ],
})
export class CreditsModule {}
