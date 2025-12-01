// apps/api-nest/src/interface/http/auth/dto/login.dto.ts
import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class LoginDto {
    @IsEmail()
    email!: string;

    @IsString()
    @MinLength(8)
    password!: string;

    @IsOptional()
    @IsBoolean()
    remember?: boolean;
}
