import {
    Body,
    Controller,
    Post,
    Res,
    UseFilters,
    UsePipes,
    ValidationPipe,
} from "@nestjs/common";
import { Response } from "express";
import { LoginDto } from "./dto/login.dto";
import { LoginUserUseCase } from "../../../application/auth/LoginUserUseCase";
import { DomainExceptionFilter } from "../common/domain-exception.filter";
import { RegisterUserUseCase } from "../../../application/auth/RegisterUserUseCase";
import { RegisterDto } from "./dto/register.dto";
import { ConfirmUserUseCase } from "../../../application/auth/ConfirmUserUseCase";
import { ConfirmDto } from "./dto/confirm.dto";

@Controller("auth")
@UseFilters(DomainExceptionFilter)
export class AuthController {
    constructor(
        private readonly loginUC: LoginUserUseCase,
        private readonly registerUC: RegisterUserUseCase,
        private readonly confirmUC: ConfirmUserUseCase,
    ) {}

    @Post("login")
    @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
    async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
        const { token, ttl } = await this.loginUC.execute(dto);

        res.cookie("session", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== "development",
            sameSite: "lax",
            path: "/",
            maxAge: ttl * 1000,
        });

        return { ok: true, token, ttl };
    }

    @Post("register")
    @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
    async register(@Body() dto: RegisterDto) {
        const name = [dto.firstName, dto.lastName].filter(Boolean).join(" ").trim() || undefined;
        const { expiresAt } = await this.registerUC.execute({
            email: dto.email,
            password: dto.password,
            name,
        });
        return { ok: true, confirmationExpiresAt: expiresAt.toISOString() };
    }

    @Post("confirm")
    @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
    async confirm(@Body() dto: ConfirmDto) {
        await this.confirmUC.execute(dto.token);
        return { success: true };
    }
}
