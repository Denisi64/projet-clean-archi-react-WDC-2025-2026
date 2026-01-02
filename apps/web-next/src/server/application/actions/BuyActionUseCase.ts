import { ActionRepository } from "../../domain/actions/ports/ActionRepository";
import { PortfolioRepository } from "../../domain/actions/ports/PortfolioRepository";
import { ActionTradeRepository } from "../../domain/actions/ports/ActionTradeRepository";
import { ActionNotFoundError } from "../../domain/actions/errors/ActionNotFoundError";
import { ActionUnavailableError } from "../../domain/actions/errors/ActionUnavailableError";
import { InsufficientActionStockError } from "../../domain/actions/errors/InsufficientActionStockError";
import { InvalidActionQuantityError } from "../../domain/actions/errors/InvalidActionQuantityError";
import { ActionStockNotifier } from "./ports/ActionStockNotifier";
import { normalizeQuantity, toUnits, formatUnits } from "./ActionQuantity";
import { Result, err, ok } from "../Result";

type Input = { userId: string; actionId: string; quantity: string };
type BuyActionError =
    | ActionNotFoundError
    | ActionUnavailableError
    | InsufficientActionStockError
    | InvalidActionQuantityError
    | Error;

export class BuyActionUseCase {
    constructor(
        private readonly actionRepo: ActionRepository,
        private readonly portfolioRepo: PortfolioRepository,
        private readonly tradeRepo: ActionTradeRepository,
        private readonly notifier: ActionStockNotifier = { notifyActionStockChanged: async () => {} },
    ) {}

    async execute(input: Input): Promise<Result<{ actionId: string; quantity: string }, BuyActionError>> {
        const normalizedQuantity = normalizeQuantity(input.quantity);
        if (!normalizedQuantity.ok) return err(normalizedQuantity.error);

        const action = await this.actionRepo.findById(input.actionId);
        if (!action) return err(new ActionNotFoundError());
        if (!action.isAvailable) return err(new ActionUnavailableError());

        const stockUnitsResult = toUnits(action.availableStock);
        if (!stockUnitsResult.ok) return err(stockUnitsResult.error);

        if (stockUnitsResult.value < normalizedQuantity.value.units) {
            return err(new InsufficientActionStockError());
        }

        const priceUnitsResult = toUnits(action.price);
        if (!priceUnitsResult.ok) return err(priceUnitsResult.error);

        const existingPosition = await this.portfolioRepo.findPosition(input.userId, input.actionId);
        const currentQtyUnitsResult = existingPosition ? toUnits(existingPosition.quantity) : ok(0);
        if (!currentQtyUnitsResult.ok) return err(currentQtyUnitsResult.error);

        const currentAvgUnitsResult = existingPosition ? toUnits(existingPosition.avgPrice) : ok(0);
        if (!currentAvgUnitsResult.ok) return err(currentAvgUnitsResult.error);

        const nextQtyUnits = currentQtyUnitsResult.value + normalizedQuantity.value.units;
        const totalCostUnits =
            currentQtyUnitsResult.value * currentAvgUnitsResult.value +
            normalizedQuantity.value.units * priceUnitsResult.value;
        const nextAvgUnits = nextQtyUnits === 0 ? 0 : Math.round(totalCostUnits / nextQtyUnits);

        const nextStockUnits = stockUnitsResult.value - normalizedQuantity.value.units;

        const tradeResult = await this.tradeRepo.executeBuy({
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
