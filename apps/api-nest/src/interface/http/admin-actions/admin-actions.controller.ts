import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    UseFilters,
    UseGuards,
    UsePipes,
    ValidationPipe,
} from "@nestjs/common";
import { CreateActionUseCase } from "@proj/application/actions/CreateActionUseCase";
import { UpdateActionUseCase } from "@proj/application/actions/UpdateActionUseCase";
import { DeleteActionUseCase } from "@proj/application/actions/DeleteActionUseCase";
import { ListActionsUseCase } from "@proj/application/actions/ListActionsUseCase";
import { DirectorRoleGuard } from "../common/director-role.guard";
import { DomainExceptionFilter } from "../common/domain-exception.filter";
import { CreateActionDto } from "./dto/create-action.dto";
import { UpdateActionDto } from "./dto/update-action.dto";

@Controller("admin/actions")
@UseGuards(DirectorRoleGuard)
@UseFilters(DomainExceptionFilter)
export class AdminActionsController {
    constructor(
        private readonly listActionsUC: ListActionsUseCase,
        private readonly createActionUC: CreateActionUseCase,
        private readonly updateActionUC: UpdateActionUseCase,
        private readonly deleteActionUC: DeleteActionUseCase,
    ) {}

    @Get()
    async list() {
        const result = await this.listActionsUC.execute({ includeUnavailable: true });
        if (!result.ok) {
            throw result.error;
        }
        return { actions: result.value };
    }

    @Post()
    @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
    async create(@Body() body: CreateActionDto) {
        const result = await this.createActionUC.execute({
            symbol: body.symbol,
            name: body.name,
            price: body.price,
            availableStock: body.availableStock,
            isAvailable: body.isAvailable ?? true,
        });
        if (!result.ok) {
            throw result.error;
        }
        return { action: result.value };
    }

    @Patch(":id")
    @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
    async update(@Param("id") actionId: string, @Body() body: UpdateActionDto) {
        const result = await this.updateActionUC.execute({
            actionId,
            name: body.name,
            isAvailable: body.isAvailable,
        });
        if (!result.ok) {
            throw result.error;
        }
        return { action: result.value };
    }

    @Delete(":id")
    async remove(@Param("id") actionId: string) {
        const result = await this.deleteActionUC.execute({ actionId });
        if (!result.ok) {
            throw result.error;
        }
        return { action: result.value };
    }
}
