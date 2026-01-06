export type ActionSnapshot = {
    id: string;
    symbol: string;
    name: string;
    price: string;
    availableStock: string;
    isAvailable: boolean;
    createdAt: Date;
    updatedAt: Date;
};

export type CreateActionInput = {
    symbol: string;
    name: string;
    price: string;
    availableStock: string;
    isAvailable: boolean;
};

export type UpdateActionInput = {
    id: string;
    name?: string;
    isAvailable?: boolean;
};

export interface ActionRepository {
    findById(id: string): Promise<ActionSnapshot | null>;
    findBySymbol(symbol: string): Promise<ActionSnapshot | null>;
    listAll(): Promise<ActionSnapshot[]>;
    listAvailable(): Promise<ActionSnapshot[]>;
    create(input: CreateActionInput): Promise<ActionSnapshot>;
    update(input: UpdateActionInput): Promise<ActionSnapshot>;
    delete(id: string): Promise<ActionSnapshot>;
}
