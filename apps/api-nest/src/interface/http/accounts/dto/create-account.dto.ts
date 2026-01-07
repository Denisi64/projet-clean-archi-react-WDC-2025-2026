import { AccountType } from "@proj/domain/accounts/AccountType";
import { IsEnum, IsOptional, IsString, Length } from "class-validator";

export class CreateAccountDto {
    @IsOptional()
    @IsString()
    @Length(2, 80)
    name?: string;

    @IsOptional()
    @IsEnum(AccountType)
    type?: AccountType;
}
