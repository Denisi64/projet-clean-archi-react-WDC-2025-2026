import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  UseFilters,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { GetUserAccountsUseCase } from '@proj/application/accounts/GetUserAccountsUseCase';
import { DomainExceptionFilter } from '../common/domain-exception.filter';
import { CreateAccountForUserUseCase } from '@proj/application/accounts/CreateAccountForUserUseCase';
import { CreateAccountDto } from './dto/create-account.dto';
import { RenameAccountUseCase } from '@application/src/accounts/RenameAccountUseCase';
import { RenameAccountDto } from './dto/rename-account.dto';
import { CloseAccountUseCase } from '@proj/application/accounts/CloseAccountUseCase';
import { TokenVerifier } from '@proj/domain/auth/ports/TokenVerifier';
import { ClientRoleGuard } from '../common/client-role.guard';
import { UnauthorizedAccessError } from '@proj/domain/auth/errors/UnauthorizedAccessError';

function extractSessionCookie(req: Request): string | null {
  const raw = req.headers?.cookie ?? '';
  const cookie = raw
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith('session='));
  return cookie ? decodeURIComponent(cookie.replace('session=', '')) : null;
}

@Controller('accounts')
@UseFilters(DomainExceptionFilter)
@UseGuards(ClientRoleGuard)
export class AccountsController {
  constructor(
    private readonly getAccounts: GetUserAccountsUseCase,
    private readonly createAccount: CreateAccountForUserUseCase,
    private readonly renameAccount: RenameAccountUseCase,
    private readonly closeAccount: CloseAccountUseCase,
    @Inject('TokenVerifier') private readonly tokenVerifier: TokenVerifier,
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

  @Get('me')
  async me(@Req() req: Request) {
    const userId = await this.extractUserIdOrThrow(req);
    const result = await this.getAccounts.execute(userId);
    if (!result.ok) {
      throw result.error;
    }
    return { accounts: result.value };
  }

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async create(@Req() req: Request, @Body() body: CreateAccountDto) {
    const userId = await this.extractUserIdOrThrow(req);
    const result = await this.createAccount.execute({
      userId,
      name: body?.name,
      type: body?.type,
    });
    if (!result.ok) {
      throw result.error;
    }
    return { account: result.value };
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async rename(
    @Req() req: Request,
    @Param('id') accountId: string,
    @Body() body: RenameAccountDto,
  ) {
    const userId = await this.extractUserIdOrThrow(req);
    const result = await this.renameAccount.execute({
      accountId,
      userId,
      name: body.name,
    });
    if (!result.ok) {
      throw result.error;
    }
    return { account: result.value };
  }

  @Post(':id/close')
  async close(@Req() req: Request, @Param('id') accountId: string) {
    const userId = await this.extractUserIdOrThrow(req);
    const result = await this.closeAccount.execute({ accountId, userId });
    if (!result.ok) {
      throw result.error;
    }
    return { account: result.value };
  }
}
