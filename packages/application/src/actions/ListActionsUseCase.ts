import { ActionRepository, ActionSnapshot } from "@proj/domain/actions/ports/ActionRepository";
import { Result, ok, err } from "../Result";

type Input = { includeUnavailable?: boolean };
type ListActionsError = Error;

export class ListActionsUseCase {
    constructor(private readonly repo: ActionRepository) {}

    async execute(input: Input = {}): Promise<Result<ActionSnapshot[], ListActionsError>> {
        try {
            const actions = input.includeUnavailable ? await this.repo.listAll() : await this.repo.listAvailable();
            return ok(actions);
        } catch (e: any) {
            return err(e instanceof Error ? e : new Error("ACTIONS_LIST_FAILED"));
        }
    }
}
