import { NextRequest, NextResponse } from "next/server";
import { PrismaAuthRepository } from "@/server/infrastructure/auth/PrismaAuthRepository";
import { BCryptPasswordHasher } from "@/server/infrastructure/auth/BCryptPasswordHasher";
import { JwtTokenManager } from "@/server/infrastructure/auth/JwtTokenManager";
import { RegisterUserUseCase } from "@/server/application/auth/RegisterUserUseCase";
import { EmailAlreadyInUseError } from "@/server/domain/auth/errors/EmailAlreadyInUseError";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password, remember } = body ?? {};

        if (!email || !password) {
            return NextResponse.json(
                { message: "Missing email or password" },
                { status: 400 },
            );
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error("JWT_SECRET is not set");
            return NextResponse.json(
                { message: "Server configuration error" },
                { status: 500 },
            );
        }

        const useCase = new RegisterUserUseCase(
            new PrismaAuthRepository(),
            new BCryptPasswordHasher(),
            new JwtTokenManager(secret), // 👈 IMPORTANT
        );

        const result = await useCase.execute({ email, password, remember });

        return NextResponse.json(result, { status: 201 });
    } catch (err: any) {
        if (err instanceof EmailAlreadyInUseError) {
            return NextResponse.json(
                { message: "Email is already in use" },
                { status: 409 },
            );
        }

        console.error("Error in /api/auth/register:", err);

        return NextResponse.json(
            { message: "Internal error" },
            { status: 500 },
        );
    }
}
