import { IsNumber, IsString, IsNotEmpty, Min } from "class-validator";

export class GrantCreditDto {
    @IsString()
    @IsNotEmpty()
    userId!: string;

    @IsNumber()
    @Min(1)
    principal!: number;

    @IsNumber()
    @Min(0.0001)
    annualRate!: number;

    @IsNumber()
    @Min(0)
    insuranceRate!: number;

    @IsNumber()
    @Min(1)
    termMonths!: number;
}
