export type PortfolioPosition = {
    userId: string;
    actionId: string;
    quantity: string;
    avgPrice: string;
};

export type PortfolioView = {
    actionId: string;
    symbol: string;
    name: string;
    price: string;
    isAvailable: boolean;
    quantity: string;
    avgPrice: string;
};

export interface PortfolioRepository {
    findPosition(userId: string, actionId: string): Promise<PortfolioPosition | null>;
    listByUser(userId: string): Promise<PortfolioView[]>;
}
