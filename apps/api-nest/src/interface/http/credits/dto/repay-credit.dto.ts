import { IsNotEmpty, IsString } from "class-validator";

export class RepayCreditDto {
    @IsString()
    @IsNotEmpty()
    creditId!: string;
}
