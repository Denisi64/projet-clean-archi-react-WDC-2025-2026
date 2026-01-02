import { ActionRepository } from "../../domain/actions/ports/ActionRepository";
import { PortfolioRepository } from "../../domain/actions/ports/PortfolioRepository";
import { ActionTradeRepository } from "../../domain/actions/ports/ActionTradeRepository";
import { ActionNotFoundError } from "../../domain/actions/errors/ActionNotFoundError";
import { InsufficientActionQuantityError } from "../../domain/actions/errors/InsufficientActionQuantityError";
import { InvalidActionQuantityError } from "../../domain/actions/errors/InvalidActionQuantityError";
import { ActionStockNotifier } from "./ports/ActionStockNotifier";
import { normalizeQuantity, toUnits, formatUnits } from "./ActionQuantity";
import { Result, err, ok } from "../Result";

type Input = { userId: string; actionId: string; quantity: string };
type SellActionError =
    | ActionNotFoundError
    | InsufficientActionQuantityError
    | InvalidActionQuantityError
    | Error;

export class SellActionUseCase {
    constructor(
        private readonly actionRepo: ActionRepository,
        private readonly portfolioRepo: PortfolioRepository,
        private readonly tradeRepo: ActionTradeRepository,
        private readonly notifier: ActionStockNotifier = { notifyActionStockChanged: async () => {} },
    ) {}

    async execute(input: Input): Promise<Result<{ actionId: string; quantity: string }, SellActionError>> {
        const normalizedQuantity = normalizeQuantity(input.quantity);
        if (!normalizedQuantity.ok) return err(normalizedQuantity.error);

        const action = await this.actionRepo.findById(input.actionId);
        if (!action) return err(new ActionNotFoundError());

        const existingPosition = await this.portfolioRepo.findPosition(input.userId, input.actionId);
        if (!existingPosition) return err(new InsufficientActionQuantityError());

        const currentQtyUnitsResult = toUnits(existingPosition.quantity);
        if (!currentQtyUnitsResult.ok) return err(currentQtyUnitsResult.error);

        if (currentQtyUnitsResult.value < normalizedQuantity.value.units) {
            return err(new InsufficientActionQuantityError());
        }

        const stockUnitsResult = toUnits(action.availableStock);
        if (!stockUnitsResult.ok) return err(stockUnitsResult.error);

        const currentAvgUnitsResult = toUnits(existingPosition.avgPrice);
        if (!currentAvgUnitsResult.ok) return err(currentAvgUnitsResult.error);

        const nextQtyUnits = currentQtyUnitsResult.value - normalizedQuantity.value.units;
        const nextStockUnits = stockUnitsResult.value + normalizedQuantity.value.units;
        const nextAvgUnits = nextQtyUnits === 0 ? 0 : currentAvgUnitsResult.value;

        const tradeResult = await this.tradeRepo.executeSell({
            userId: input.userId,
            actionId: action.id,
            quantity: normalizedQuantity.value.normalized,
            price: action.price,
            nextStock: formatUnits(nextStockUnits),
            nextQuantity: formatUnits(nextQtyUnits),
            nextAvgPrice: formatUnits(nextAvgUnits),
        });

        await this.notifier.notifyActionStockChanged({
            actionId: tradeResult.action.id,
            symbol: tradeResult.action.symbol,
            availableStock: tradeResult.action.availableStock,
            isAvailable: tradeResult.action.isAvailable,
        });

        return ok({ actionId: tradeResult.action.id, quantity: tradeResult.position.quantity });
    }
}
