import { IsBoolean, IsOptional, IsString, Length } from "class-validator";

export class UpdateActionDto {
    @IsOptional()
    @IsString()
    @Length(2, 120)
    name?: string;

    @IsOptional()
    @IsBoolean()
    isAvailable?: boolean;
}
