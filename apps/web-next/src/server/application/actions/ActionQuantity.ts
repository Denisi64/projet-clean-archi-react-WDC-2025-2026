import { Result, err, ok } from "../Result";
import { InvalidActionQuantityError } from "../../domain/actions/errors/InvalidActionQuantityError";

const SCALE = 10000;

export function formatUnits(units: number): string {
    const whole = Math.floor(units / SCALE);
    const decimals = (units % SCALE).toString().padStart(4, "0");
    return `${whole}.${decimals}`;
}

export function toUnits(value: string): Result<number, InvalidActionQuantityError> {
    const trimmed = value.trim();
    const match = trimmed.match(/^\d+(\.\d{1,4})?$/);
    if (!match) return err(new InvalidActionQuantityError());
    const [intPart, decPart = ""] = trimmed.split(".");
    const normalizedDec = (decPart + "0000").slice(0, 4);
    const units = Number(intPart) * SCALE + Number(normalizedDec);
    if (!Number.isFinite(units)) return err(new InvalidActionQuantityError());
    return ok(units);
}

export function normalizeQuantity(value: string): Result<{ units: number; normalized: string }, InvalidActionQuantityError> {
    const unitsResult = toUnits(value);
    if (!unitsResult.ok) return unitsResult;
    if (unitsResult.value <= 0) {
        return err(new InvalidActionQuantityError());
    }
    return ok({ units: unitsResult.value, normalized: formatUnits(unitsResult.value) });
}

export function normalizeNonNegativeQuantity(
    value: string,
): Result<{ units: number; normalized: string }, InvalidActionQuantityError> {
    const unitsResult = toUnits(value);
    if (!unitsResult.ok) return unitsResult;
    if (unitsResult.value < 0) {
        return err(new InvalidActionQuantityError());
    }
    return ok({ units: unitsResult.value, normalized: formatUnits(unitsResult.value) });
}
