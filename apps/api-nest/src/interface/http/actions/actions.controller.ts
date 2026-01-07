import {
    Body,
    Controller,
    Get,
    Inject,
    Param,
    Post,
    Req,
    UseFilters,
    UseGuards,
    UsePipes,
    ValidationPipe,
} from "@nestjs/common";
import { Request } from "express";
import { ListActionsUseCase } from "@proj/application/actions/ListActionsUseCase";
import { BuyActionUseCase } from "@proj/application/actions/BuyActionUseCase";
import { SellActionUseCase } from "@proj/application/actions/SellActionUseCase";
import { GetPortfolioUseCase } from "@proj/application/actions/GetPortfolioUseCase";
import { TokenVerifier } from "@proj/domain/auth/ports/TokenVerifier";
import { UnauthorizedAccessError } from "@proj/domain/auth/errors/UnauthorizedAccessError";
import { ClientRoleGuard } from "../common/client-role.guard";
import { DomainExceptionFilter } from "../common/domain-exception.filter";
import { TradeActionDto } from "./dto/trade-action.dto";

function extractSessionCookie(req: Request): string | null {
    const raw = req.headers?.cookie ?? "";
    const cookie = raw
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith("session="));
    return cookie ? decodeURIComponent(cookie.replace("session=", "")) : null;
}

@Controller("actions")
@UseFilters(DomainExceptionFilter)
export class ActionsController {
    constructor(
        private readonly listActionsUC: ListActionsUseCase,
        private readonly buyActionUC: BuyActionUseCase,
        private readonly sellActionUC: SellActionUseCase,
        private readonly getPortfolioUC: GetPortfolioUseCase,
        @Inject("TokenVerifier") private readonly tokenVerifier: TokenVerifier,
    ) {}

    private async extractUserIdOrThrow(req: Request): Promise<string> {
        const token = extractSessionCookie(req);
        if (!token) {
            throw new UnauthorizedAccessError();
        }

        const userId = await this.tokenVerifier.verify(token);
        if (!userId) {
            throw new UnauthorizedAccessError();
        }

        return userId;
    }

    @Get()
    async list() {
        const result = await this.listActionsUC.execute({ includeUnavailable: true });
        if (!result.ok) {
            throw result.error;
        }
        return { actions: result.value };
    }

    @Get("portfolio")
    @UseGuards(ClientRoleGuard)
    async portfolio(@Req() req: Request) {
        const userId = await this.extractUserIdOrThrow(req);
        const result = await this.getPortfolioUC.execute({ userId });
        if (!result.ok) {
            throw result.error;
        }
        return { positions: result.value };
    }

    @Post(":id/buy")
    @UseGuards(ClientRoleGuard)
    @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
    async buy(@Req() req: Request, @Param("id") actionId: string, @Body() body: TradeActionDto) {
        const userId = await this.extractUserIdOrThrow(req);
        const result = await this.buyActionUC.execute({ userId, actionId, quantity: body.quantity });
        if (!result.ok) {
            throw result.error;
        }
        return { actionId: result.value.actionId, quantity: result.value.quantity };
    }

    @Post(":id/sell")
    @UseGuards(ClientRoleGuard)
    @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
    async sell(@Req() req: Request, @Param("id") actionId: string, @Body() body: TradeActionDto) {
        const userId = await this.extractUserIdOrThrow(req);
        const result = await this.sellActionUC.execute({ userId, actionId, quantity: body.quantity });
        if (!result.ok) {
            throw result.error;
        }
        return { actionId: result.value.actionId, quantity: result.value.quantity };
    }
}
