import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { SearchUsersUseCase } from "@proj/application/users/SearchUsersUseCase";
import { AdvisorRoleGuard } from "../common/advisor-role.guard";

@Controller("advisor/users")
@UseGuards(AdvisorRoleGuard)
export class UsersController {
    constructor(private readonly searchUsersUC: SearchUsersUseCase) {}

    @Get()
    async search(@Query("query") query = "") {
        const result = await this.searchUsersUC.execute(query ?? "");
        if (!result.ok) {
            throw result.error;
        }
        return { users: result.value };
    }
}
