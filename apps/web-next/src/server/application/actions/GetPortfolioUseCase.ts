import { PortfolioRepository, PortfolioView } from "../../domain/actions/ports/PortfolioRepository";
import { Result, err, ok } from "../Result";

type Input = { userId: string };
type GetPortfolioError = Error;

export class GetPortfolioUseCase {
    constructor(private readonly repo: PortfolioRepository) {}

    async execute(input: Input): Promise<Result<PortfolioView[], GetPortfolioError>> {
        try {
            const positions = await this.repo.listByUser(input.userId);
            return ok(positions);
        } catch (e: any) {
            return err(e instanceof Error ? e : new Error("PORTFOLIO_LIST_FAILED"));
        }
    }
}
