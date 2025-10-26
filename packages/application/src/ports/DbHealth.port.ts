export type DbDriver = 'memory' | 'postgres' | 'mariadb';

export interface DbHealthPort {
    driver(): DbDriver;
    ping(): Promise<{ ok: boolean; message?: string }>;
}
