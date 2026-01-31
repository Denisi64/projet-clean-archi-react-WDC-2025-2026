import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtTokenVerifier } from '@proj/infra/auth/JwtTokenVerifier';

@Injectable()
export class JwtHttpAuthGuard implements CanActivate {
    constructor(private readonly jwt: JwtTokenVerifier) {}

    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest<Request>();

        const cookieHeader = req.headers.cookie;
        if (!cookieHeader) {
            throw new UnauthorizedException();
        }

        const sessionCookie = cookieHeader
            .split('; ')
            .find((c) => c.startsWith('session='));

        if (!sessionCookie) {
            throw new UnauthorizedException();
        }

        const token = sessionCookie.split('=')[1];

        try {
            const payload = this.jwt.verify(token);

            (req as any).user = {
                id: payload.sub,
                role: payload.role,
            };

            return true;
        } catch {
            throw new UnauthorizedException();
        }
    }
}
