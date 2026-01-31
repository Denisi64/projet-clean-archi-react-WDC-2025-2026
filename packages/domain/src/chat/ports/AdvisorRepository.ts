import { UserRole } from "@proj/domain/users/ports/UserQueryRepository";

export interface Advisor {
    id: string;
    email: string;
    role: UserRole;
}

export interface AdvisorRepository {
    findAllAdvisors(): Promise<Advisor[]>;
}
