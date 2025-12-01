import { IsEmail, IsNotEmpty, IsOptional, IsBoolean, MinLength } from "class-validator";

export class RegisterDto {
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @MinLength(8)
    password: string;

    @IsOptional()
    @IsBoolean()
    remember?: boolean;

    @IsOptional()
    @IsNotEmpty()
    firstName?: string;

    @IsOptional()
    @IsNotEmpty()
    lastName?: string;
}
