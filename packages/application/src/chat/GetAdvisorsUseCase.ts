import { AdvisorRepository } from '@domain/src/chat/ports/AdvisorRepository';

export class GetAdvisorsUseCase {
    constructor(
        private readonly advisors: AdvisorRepository,
    ) {}

    async execute() {
        return this.advisors.findAllAdvisors();
    }
}
