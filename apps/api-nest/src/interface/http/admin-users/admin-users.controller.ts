import { Controller, Get, Param, Post, Query, UseGuards, UseFilters } from "@nestjs/common";
import { SearchUsersUseCase } from "@proj/application/users/SearchUsersUseCase";
import { BanUserUseCase } from "@proj/application/users/BanUserUseCase";
import { DirectorRoleGuard } from "../common/director-role.guard";
import { DomainExceptionFilter } from "../common/domain-exception.filter";

@Controller("admin/users")
@UseGuards(DirectorRoleGuard)
@UseFilters(DomainExceptionFilter)
export class AdminUsersController {
    constructor(
        private readonly searchUsersUC: SearchUsersUseCase,
        private readonly banUserUC: BanUserUseCase,
    ) {}

    @Get()
    async search(@Query("query") query = "") {
        const result = await this.searchUsersUC.execute(query ?? "");
        if (!result.ok) {
            throw result.error;
        }
        return { users: result.value };
    }

    @Post(":id/ban")
    async ban(@Param("id") userId: string) {
        const result = await this.banUserUC.execute(userId);
        if (!result.ok) {
            throw result.error;
        }
        return { ok: true, user: result.value };
    }
}
