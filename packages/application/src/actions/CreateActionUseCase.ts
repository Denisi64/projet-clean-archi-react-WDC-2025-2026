import { ActionRepository, ActionSnapshot } from "@proj/domain/actions/ports/ActionRepository";
import { ActionSymbolAlreadyExistsError } from "@proj/domain/actions/errors/ActionSymbolAlreadyExistsError";
import { InvalidActionInputError } from "@proj/domain/actions/errors/InvalidActionInputError";
import { normalizeNonNegativeQuantity, normalizeQuantity } from "./ActionQuantity";
import { Result, err, ok } from "../Result";

type Input = {
    symbol: string;
    name: string;
    price: string;
    availableStock: string;
    isAvailable?: boolean;
};
type CreateActionError = InvalidActionInputError | ActionSymbolAlreadyExistsError | Error;

export class CreateActionUseCase {
    constructor(private readonly repo: ActionRepository) {}

    async execute(input: Input): Promise<Result<ActionSnapshot, CreateActionError>> {
        const symbol = input.symbol.trim().toUpperCase();
        const name = input.name.trim();
        if (symbol.length < 2 || symbol.length > 10 || name.length < 2) {
            return err(new InvalidActionInputError());
        }

        const priceResult = normalizeQuantity(input.price);
        if (!priceResult.ok) return err(new InvalidActionInputError());

        const stockResult = normalizeNonNegativeQuantity(input.availableStock);
        if (!stockResult.ok) return err(new InvalidActionInputError());

        try {
            const existing = await this.repo.findBySymbol(symbol);
            if (existing) {
                return err(new ActionSymbolAlreadyExistsError());
            }

            const created = await this.repo.create({
                symbol,
                name,
                price: priceResult.value.normalized,
                availableStock: stockResult.value.normalized,
                isAvailable: input.isAvailable ?? true,
            });
            return ok(created);
        } catch (e: any) {
            return err(e instanceof Error ? e : new Error("ACTION_CREATE_FAILED"));
        }
    }
}
