import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseFilters,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { DomainExceptionFilter } from '../common/domain-exception.filter';
import { DirectorRoleGuard } from '../common/director-role.guard';
import { CreateAccountForUserUseCase } from '@proj/application/accounts/CreateAccountForUserUseCase';
import { RenameAccountUseCase } from '@application/src/accounts/RenameAccountUseCase';
import { CloseAccountUseCase } from '@proj/application/accounts/CloseAccountUseCase';
import { CreateAdminAccountDto } from './dto/create-admin-account.dto';
import { RenameAdminAccountDto } from './dto/rename-admin-account.dto';
import { CloseAdminAccountDto } from './dto/close-admin-account.dto';
import { ListAdminAccountsDto } from './dto/list-admin-accounts.dto';
import { GetUserAccountsUseCase } from '@proj/application/accounts/GetUserAccountsUseCase';

@Controller('admin/accounts')
@UseGuards(DirectorRoleGuard)
@UseFilters(DomainExceptionFilter)
export class AdminAccountsController {
  constructor(
    private readonly createAccountUC: CreateAccountForUserUseCase,
    private readonly renameAccountUC: RenameAccountUseCase,
    private readonly closeAccountUC: CloseAccountUseCase,
    private readonly listAccountsUC: GetUserAccountsUseCase,
  ) {}

  @Get()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async list(@Query() query: ListAdminAccountsDto) {
    if (!query.userId) {
      return { accounts: [] };
    }
    const result = await this.listAccountsUC.execute(query.userId);
    if (!result.ok) {
      throw result.error;
    }
    return { accounts: result.value };
  }

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async create(@Body() dto: CreateAdminAccountDto) {
    const result = await this.createAccountUC.execute({
      userId: dto.userId,
      name: dto.name,
      type: dto.type,
    });
    if (!result.ok) {
      throw result.error;
    }
    return { account: result.value };
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async rename(
    @Param('id') accountId: string,
    @Body() dto: RenameAdminAccountDto,
  ) {
    const result = await this.renameAccountUC.execute({
      accountId,
      userId: dto.userId,
      name: dto.name,
    });
    if (!result.ok) {
      throw result.error;
    }
    return { account: result.value };
  }

  @Post(':id/close')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async close(
    @Param('id') accountId: string,
    @Body() dto: CloseAdminAccountDto,
  ) {
    const result = await this.closeAccountUC.execute({
      accountId,
      userId: dto.userId,
    });
    if (!result.ok) {
      throw result.error;
    }
    return { account: result.value };
  }
}
