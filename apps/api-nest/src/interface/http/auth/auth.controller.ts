import {
    Body,
    Controller,
    Get,
    Inject,
    Post,
    Req,
    Res,
    UseFilters,
    UsePipes,
    ValidationPipe,
} from "@nestjs/common";
import { Response } from "express";
import { Request } from "express";
import { LoginDto } from "./dto/login.dto";
import { LoginUserUseCase } from "@proj/application/auth/LoginUserUseCase";
import { DomainExceptionFilter } from "../common/domain-exception.filter";
import { RegisterUserUseCase } from "@proj/application/auth/RegisterUserUseCase";
import { RegisterDto } from "./dto/register.dto";
import { ConfirmUserUseCase } from "@proj/application/auth/ConfirmUserUseCase";
import { ConfirmDto } from "./dto/confirm.dto";
import { TokenVerifier } from "@proj/domain/auth/ports/TokenVerifier";
import { GetUserProfileUseCase } from "@proj/application/users/GetUserProfileUseCase";
import { UnauthorizedAccessError } from "@proj/domain/auth/errors/UnauthorizedAccessError";

function extractSessionCookie(req: Request): string | null {
    const raw = req.headers?.cookie ?? "";
    const cookie = raw
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith("session="));
    return cookie ? decodeURIComponent(cookie.replace("session=", "")) : null;
}

@Controller("auth")
@UseFilters(DomainExceptionFilter)
export class AuthController {
    constructor(
        private readonly loginUC: LoginUserUseCase,
        private readonly registerUC: RegisterUserUseCase,
        private readonly confirmUC: ConfirmUserUseCase,
        private readonly getProfileUC: GetUserProfileUseCase,
        @Inject("TokenVerifier") private readonly tokenVerifier: TokenVerifier,
    ) {}

    @Post("login")
    @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
    async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
        const result = await this.loginUC.execute(dto);
        if (!result.ok) {
            throw result.error;
        }
        const { token, ttl } = result.value;

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
        const result = await this.registerUC.execute({
            email: dto.email,
            password: dto.password,
            name,
        });
        if (!result.ok) {
            throw result.error;
        }
        const { expiresAt } = result.value;
        return { ok: true, confirmationExpiresAt: expiresAt.toISOString() };
    }

    @Post("confirm")
    @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
    async confirm(@Body() dto: ConfirmDto) {
        const result = await this.confirmUC.execute(dto.token);
        if (!result.ok) {
            throw result.error;
        }
        return { success: true };
    }

    @Get("me")
    async me(@Req() req: Request) {
        const token = extractSessionCookie(req);
        if (!token) {
            throw new UnauthorizedAccessError();
        }

        const userId = await this.tokenVerifier.verify(token);
        if (!userId) {
            throw new UnauthorizedAccessError();
        }

        const result = await this.getProfileUC.execute(userId);
        if (!result.ok || !result.value) {
            throw new UnauthorizedAccessError();
        }

        const user = result.value;
        return {
            ok: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                bannedAt: user.bannedAt ?? null,
            },
        };
    }
}
