import {
    Body,
    Controller,
    Get,
    Post,
    Query,
    BadRequestException,
    UseGuards,
    UseFilters,
    UsePipes,
    ValidationPipe,
} from "@nestjs/common";
import { ApplyDailySavingsInterestUseCase } from "@proj/application/accounts/ApplyDailySavingsInterestUseCase";
import { DomainExceptionFilter } from "../common/domain-exception.filter";
import { UpdateSavingsRateUseCase } from "@proj/application/accounts/UpdateSavingsRateUseCase";
import { GetActiveSavingsRateUseCase } from "@proj/application/accounts/GetActiveSavingsRateUseCase";
import { UpdateSavingsRateDto } from "./dto/update-savings-rate.dto";
import { DirectorRoleGuard } from "../common/director-role.guard";

type ApplyRequest = { force?: boolean };

@Controller("admin/savings")
@UseFilters(DomainExceptionFilter)
@UseGuards(DirectorRoleGuard)
export class SavingsController {
    constructor(
        private readonly applyInterestUC: ApplyDailySavingsInterestUseCase,
        private readonly updateRateUC: UpdateSavingsRateUseCase,
        private readonly getRateUC: GetActiveSavingsRateUseCase,
    ) {}

    @Post("apply-interest")
    async apply(
        @Body() _body: ApplyRequest,
        @Query("mode") modeParam?: string,
    ) {
        const mode = modeParam === "annual" ? "annual" : "daily";
        const result = await this.applyInterestUC.execute({ mode });
        if (!result.ok) {
            throw result.error;
        }
        return { ok: true, applied: result.value, mode };
    }

    @Get("rate")
    async getRate() {
        const result = await this.getRateUC.execute();
        if (!result.ok) {
            throw result.error;
        }
        const current = result.value;
        const ratePercent = current !== null ? Math.round(current * 10000) / 100 : null;
        return { ratePercent };
    }

    @Post("rate")
    @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
    async updateRate(
        @Body() dto: UpdateSavingsRateDto,
    ) {
        const role: "DIRECTOR" = "DIRECTOR";
        const result = await this.updateRateUC.execute({ actorRole: role, rate: dto.ratePercent / 100 });
        if (!result.ok) {
            if (result.error === "FORBIDDEN") {
                throw new BadRequestException("FORBIDDEN");
            }
            if (result.error === "INVALID_RATE") {
                throw new BadRequestException("INVALID_RATE");
            }
            throw result.error;
        }

        return { ok: true, ratePercent: dto.ratePercent };
    }
}
