import {
    Body,
    Controller,
    Get,
    Inject,
    Param,
    Post,
    Req,
    UseGuards,
    UseFilters,
    UsePipes,
    ValidationPipe,
} from "@nestjs/common";
import { DomainExceptionFilter } from "../common/domain-exception.filter";
import { GrantCreditUseCase } from "@proj/application/credits/GrantCreditUseCase";
import { GrantCreditDto } from "./dto/grant-credit.dto";
import { RepayCreditUseCase } from "@proj/application/credits/RepayCreditUseCase";
import { RepayCreditDto } from "./dto/repay-credit.dto";
import { ListCreditsForUserUseCase } from "@proj/application/credits/ListCreditsForUserUseCase";
import { Request } from "express";
import { TokenVerifier } from "@proj/domain/auth/ports/TokenVerifier";
import { AdvisorRoleGuard } from "../common/advisor-role.guard";
import { UnauthorizedAccessError } from "@proj/domain/auth/errors/UnauthorizedAccessError";

@Controller("advisor/credits")
@UseFilters(DomainExceptionFilter)
@UseGuards(AdvisorRoleGuard)
export class CreditsController {
    constructor(
        private readonly grantCreditUC: GrantCreditUseCase,
        private readonly repayCreditUC: RepayCreditUseCase,
        private readonly listCreditsUC: ListCreditsForUserUseCase,
        @Inject("TokenVerifier") private readonly tokenVerifier: TokenVerifier,
    ) {}

    @Post()
    @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
    async grant(@Body() dto: GrantCreditDto) {
        const result = await this.grantCreditUC.execute({
            userId: dto.userId,
            principal: dto.principal,
            annualRate: dto.annualRate,
            insuranceRate: dto.insuranceRate,
            termMonths: dto.termMonths,
        });
        if (!result.ok) {
            throw result.error;
        }
        return { ok: true, credit: result.value };
    }

    @Post(":id/repay")
    @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
    async repay(@Param() params: RepayCreditDto) {
        const result = await this.repayCreditUC.execute(params.creditId);
        if (!result.ok) {
            throw result.error;
        }
        return { ok: true, credit: result.value };
    }

    private async extractUserId(req: Request): Promise<string> {
        const raw = req.headers?.cookie ?? "";
        const cookie = raw
            .split(";")
            .map((c) => c.trim())
            .find((c) => c.startsWith("session="));
        const token = cookie ? decodeURIComponent(cookie.replace("session=", "")) : null;
        if (!token) throw new UnauthorizedAccessError();
        const userId = await this.tokenVerifier.verify(token);
        if (!userId) throw new UnauthorizedAccessError();
        return userId;
    }

    @Get("me")
    async me(@Req() req: Request) {
        const userId = await this.extractUserId(req);
        const result = await this.listCreditsUC.execute(userId);
        if (!result.ok) {
            throw result.error;
        }
        return { ok: true, credits: result.value };
    }
}
