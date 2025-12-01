// apps/api-nest/src/domain/auth/ports/TokenManager.ts
export interface TokenManager {
    issue(payload: Record<string, string>, opts: { expiresIn: string }): Promise<string>;
}
