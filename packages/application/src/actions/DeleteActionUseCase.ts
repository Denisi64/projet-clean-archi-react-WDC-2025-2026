import { ActionRepository, ActionSnapshot } from "@proj/domain/actions/ports/ActionRepository";
import { Result, err, ok } from "../Result";

type Input = { actionId: string };
type DeleteActionError = Error;

export class DeleteActionUseCase {
    constructor(private readonly repo: ActionRepository) {}

    async execute(input: Input): Promise<Result<ActionSnapshot, DeleteActionError>> {
        try {
            const deleted = await this.repo.delete(input.actionId);
            return ok(deleted);
        } catch (e: any) {
            return err(e instanceof Error ? e : new Error("ACTION_DELETE_FAILED"));
        }
    }
}
