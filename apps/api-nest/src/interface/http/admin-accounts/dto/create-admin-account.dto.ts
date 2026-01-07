import { IsEnum, IsOptional, IsString, Length } from "class-validator";
import { AccountType } from "@proj/domain/accounts/AccountType";

export class CreateAdminAccountDto {
    @IsString()
    @Length(8, 64)
    userId!: string;

    @IsOptional()
    @IsString()
    @Length(2, 80)
    name?: string;

    @IsOptional()
    @IsEnum(AccountType)
    type?: AccountType;
}
