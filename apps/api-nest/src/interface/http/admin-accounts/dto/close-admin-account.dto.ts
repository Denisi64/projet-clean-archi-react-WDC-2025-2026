import { IsString, Length } from "class-validator";

export class CloseAdminAccountDto {
    @IsString()
    @Length(8, 64)
    userId!: string;
}
