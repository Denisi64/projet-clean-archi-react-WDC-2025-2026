export interface TokenManager {
    issue(payload: Record<string, string>, opts: { expiresIn: string }): Promise<string>;
}