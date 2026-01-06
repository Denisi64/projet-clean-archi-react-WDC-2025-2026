export type ActionStockPayload = {
    actionId: string;
    symbol: string;
    availableStock: string;
    isAvailable: boolean;
};

export interface ActionStockNotifier {
    notifyActionStockChanged(payload: ActionStockPayload): Promise<void>;
}
