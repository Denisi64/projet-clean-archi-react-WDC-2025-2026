import { IsOptional, IsString, Length } from "class-validator";

export class ListAdminAccountsDto {
    @IsOptional()
    @IsString()
    @Length(8, 64)
    userId?: string;
}
