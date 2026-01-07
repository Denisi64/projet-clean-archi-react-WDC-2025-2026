import { IsString, Length } from "class-validator";

export class RenameAdminAccountDto {
    @IsString()
    @Length(8, 64)
    userId!: string;

    @IsString()
    @Length(2, 80)
    name!: string;
}
