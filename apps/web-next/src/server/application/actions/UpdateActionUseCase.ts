import { ActionRepository, ActionSnapshot } from "../../domain/actions/ports/ActionRepository";
import { InvalidActionInputError } from "../../domain/actions/errors/InvalidActionInputError";
import { Result, err, ok } from "../Result";

type Input = {
    actionId: string;
    name?: string;
    isAvailable?: boolean;
};
type UpdateActionError = InvalidActionInputError | Error;

export class UpdateActionUseCase {
    constructor(private readonly repo: ActionRepository) {}

    async execute(input: Input): Promise<Result<ActionSnapshot, UpdateActionError>> {
        const hasName = typeof input.name === "string";
        const hasAvailability = typeof input.isAvailable === "boolean";
        if (!hasName && !hasAvailability) {
            return err(new InvalidActionInputError());
        }

        const trimmedName = hasName ? input.name!.trim() : undefined;
        if (trimmedName !== undefined && trimmedName.length < 2) {
            return err(new InvalidActionInputError());
        }

        try {
            const updated = await this.repo.update({
                id: input.actionId,
                name: trimmedName,
                isAvailable: hasAvailability ? input.isAvailable : undefined,
            });
            return ok(updated);
        } catch (e: any) {
            return err(e instanceof Error ? e : new Error("ACTION_UPDATE_FAILED"));
        }
    }
}
