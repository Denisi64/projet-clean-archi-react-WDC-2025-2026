import { IsBoolean, IsOptional, IsString, Length, Matches } from "class-validator";

export class CreateActionDto {
    @IsString()
    @Length(2, 10)
    symbol!: string;

    @IsString()
    @Length(2, 120)
    name!: string;

    @IsString()
    @Matches(/^\d+(\.\d{1,4})?$/)
    price!: string;

    @IsString()
    @Matches(/^\d+(\.\d{1,4})?$/)
    availableStock!: string;

    @IsOptional()
    @IsBoolean()
    isAvailable?: boolean;
}
