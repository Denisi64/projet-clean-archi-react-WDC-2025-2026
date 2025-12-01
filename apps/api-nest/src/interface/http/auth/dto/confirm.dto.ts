import { IsNotEmpty, IsString } from "class-validator";

export class ConfirmDto {
    @IsString()
    @IsNotEmpty()
    token: string;
}
