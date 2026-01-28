import { UserRole } from "@domain/src/auth/UserRole";

export interface Advisor {
    id: string;
    email: string;
    role: UserRole;
}

export interface AdvisorRepository {
    findAllAdvisors(): Promise<Advisor[]>;
}
