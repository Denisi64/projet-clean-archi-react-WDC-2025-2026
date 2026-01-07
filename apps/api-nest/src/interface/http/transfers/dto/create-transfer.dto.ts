import { Transform } from "class-transformer";
import { IsOptional, IsString, Length, Matches } from "class-validator";

export class CreateTransferDto {
    @IsString()
    @Length(8, 64)
    sourceAccountId!: string;

    @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
    @IsString()
    @Length(10, 34)
    destinationIban!: string;

    @Transform(({ value }) => {
        if (typeof value === "number") return String(value);
        return typeof value === "string" ? value.trim() : value;
    })
    @Matches(/^\d+(\.\d{1,2})?$/)
    amount!: string;

    @IsOptional()
    @IsString()
    @Length(0, 120)
    note?: string;
}
