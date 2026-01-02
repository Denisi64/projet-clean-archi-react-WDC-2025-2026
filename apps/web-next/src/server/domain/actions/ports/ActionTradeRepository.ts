import { ActionSnapshot } from "./ActionRepository";
import { PortfolioPosition } from "./PortfolioRepository";

export interface ActionTradeRepository {
    executeBuy(input: {
        userId: string;
        actionId: string;
        quantity: string;
        price: string;
        nextStock: string;
        nextQuantity: string;
        nextAvgPrice: string;
    }): Promise<{ action: ActionSnapshot; position: PortfolioPosition }>;
    executeSell(input: {
        userId: string;
        actionId: string;
        quantity: string;
        price: string;
        nextStock: string;
        nextQuantity: string;
        nextAvgPrice: string;
    }): Promise<{ action: ActionSnapshot; position: PortfolioPosition }>;
}
