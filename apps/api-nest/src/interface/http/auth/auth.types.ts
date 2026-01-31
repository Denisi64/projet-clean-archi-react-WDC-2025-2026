import { Request } from 'express';

export type AuthenticatedRequest = Request & {
    user: {
        id: string;
        role: 'CLIENT' | 'ADVISOR' | 'DIRECTOR';
    };
};
