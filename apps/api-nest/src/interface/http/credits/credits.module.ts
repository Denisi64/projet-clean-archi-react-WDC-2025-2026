import { Module } from "@nestjs/common";
import { CreditsController } from "./credits.controller";
import { ClientCreditsController } from "./client-credits.controller";
import { GrantCreditUseCase } from "@proj/application/credits/GrantCreditUseCase";
import { RepayCreditUseCase } from "@proj/application/credits/RepayCreditUseCase";
import { ListCreditsForUserUseCase } from "@proj/application/credits/ListCreditsForUserUseCase";
import { JwtTokenVerifier } from "@proj/infra/auth/JwtTokenVerifier";
import { AdvisorRoleGuard } from "../common/advisor-role.guard";
import { ClientRoleGuard } from "../common/client-role.guard";
import { createCreditRepository, createUserQueryRepository } from "@proj/infra";

@Module({
    controllers: [CreditsController, ClientCreditsController],
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
            provide: "CreditRepository",
            useFactory: () => createCreditRepository(),
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
