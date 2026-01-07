import { IsString, Matches } from "class-validator";

export class TradeActionDto {
    @IsString()
    @Matches(/^\d+(\.\d{1,4})?$/)
    quantity!: string;
}
