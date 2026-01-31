import {
  Controller,
  Get,
  Inject,
  Req,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ListCreditsForUserUseCase } from '@application/src/credits/ListCreditsForUserUseCase';
import { TokenVerifier } from '@proj/domain/auth/ports/TokenVerifier';
import { UnauthorizedAccessError } from '@proj/domain/auth/errors/UnauthorizedAccessError';
import { DomainExceptionFilter } from '../common/domain-exception.filter';
import { ClientRoleGuard } from '../common/client-role.guard';

@Controller('credits')
@UseFilters(DomainExceptionFilter)
@UseGuards(ClientRoleGuard)
export class ClientCreditsController {
  constructor(
    private readonly listCreditsUC: ListCreditsForUserUseCase,
    @Inject('TokenVerifier') private readonly tokenVerifier: TokenVerifier,
  ) {}

  private async extractUserId(req: Request): Promise<string> {
    const raw = req.headers?.cookie ?? '';
    const cookie = raw
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('session='));
    const token = cookie
      ? decodeURIComponent(cookie.replace('session=', ''))
      : null;
    if (!token) throw new UnauthorizedAccessError();
    const userId = await this.tokenVerifier.verify(token);
    if (!userId) throw new UnauthorizedAccessError();
    return userId;
  }

  @Get('me')
  async me(@Req() req: Request) {
    const userId = await this.extractUserId(req);
    const result = await this.listCreditsUC.execute(userId);
    if (!result.ok) {
      throw result.error;
    }
    return { ok: true, credits: result.value };
  }
}
