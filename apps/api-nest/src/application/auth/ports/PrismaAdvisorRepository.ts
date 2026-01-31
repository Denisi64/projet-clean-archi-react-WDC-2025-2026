import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/PrismaService';
import {
    AdvisorRepository,
    Advisor,
} from '../../../application/chat/ports/AdvisorRepository';

@Injectable()
export class PrismaAdvisorRepository implements AdvisorRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAllAdvisors(): Promise<Advisor[]> {
        const users = await this.prisma.user.findMany({
            where: { role: 'ADVISOR' },
            select: {
                id: true,
                email: true,
                role: true,
            },
        });

        return users;
    }
}
