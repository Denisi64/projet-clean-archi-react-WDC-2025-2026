import { Transform } from "class-transformer";
import { IsString, Length } from "class-validator";

export class RenameAccountDto {
    @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
    @IsString()
    @Length(2, 80)
    name!: string;
}
