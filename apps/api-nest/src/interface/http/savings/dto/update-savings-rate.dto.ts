import { IsNumber, Max, Min } from "class-validator";

export class UpdateSavingsRateDto {
    @IsNumber()
    @Min(0.01)
    @Max(50)
    ratePercent!: number;
}
