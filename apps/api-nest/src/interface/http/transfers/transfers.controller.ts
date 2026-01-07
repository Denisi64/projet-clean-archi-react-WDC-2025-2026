import {
    Body,
    Controller,
    Get,
    Inject,
    Post,
    Query,
    Req,
    UseGuards,
    UseFilters,
    UsePipes,
    ValidationPipe,
} from "@nestjs/common";
import { Request } from "express";
import { DomainExceptionFilter } from "../common/domain-exception.filter";
import { TransferBetweenAccountsUseCase } from "@proj/application/accounts/TransferBetweenAccountsUseCase";
import { CreateTransferDto } from "./dto/create-transfer.dto";
import { ListTransfersForUserUseCase } from "@proj/application/accounts/ListTransfersForUserUseCase";
import { TokenVerifier } from "@proj/domain/auth/ports/TokenVerifier";
import { ClientRoleGuard } from "../common/client-role.guard";
import { UnauthorizedAccessError } from "@proj/domain/auth/errors/UnauthorizedAccessError";

function extractSessionCookie(req: Request): string | null {
    const raw = req.headers?.cookie ?? "";
    const cookie = raw
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith("session="));
    return cookie ? decodeURIComponent(cookie.replace("session=", "")) : null;
}

@Controller("transfers")
@UseFilters(DomainExceptionFilter)
@UseGuards(ClientRoleGuard)
export class TransfersController {
    constructor(
        private readonly transferUC: TransferBetweenAccountsUseCase,
        private readonly listTransfersUC: ListTransfersForUserUseCase,
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

    @Post()
    @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
    async create(@Req() req: Request, @Body() dto: CreateTransferDto) {
        const userId = await this.extractUserIdOrThrow(req);

        const result = await this.transferUC.execute({
            userId,
            sourceAccountId: dto.sourceAccountId,
            destinationIban: dto.destinationIban,
            amount: dto.amount,
            note: dto.note,
        });
        if (!result.ok) {
            throw result.error;
        }
        return result.value;
    }

    @Get("me")
    async listMine(@Req() req: Request, @Query("accountId") accountId?: string) {
        const userId = await this.extractUserIdOrThrow(req);
        const result = await this.listTransfersUC.execute(userId, accountId);
        if (!result.ok) {
            throw result.error;
        }
        return { transfers: result.value };
    }
}
