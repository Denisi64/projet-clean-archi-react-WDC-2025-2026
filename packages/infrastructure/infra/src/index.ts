// shared infrastructure adapters
export { BcryptPasswordHasher } from "./auth/BcryptPasswordHasher";
export { CryptoActivationTokenGenerator } from "./auth/CryptoActivationTokenGenerator";
export { JwtTokenManager } from "./auth/JwtTokenManager";
export { JwtTokenVerifier } from "./auth/JwtTokenVerifier";
export { NodemailerEmailService } from "./auth/NodemailerEmailService";
export { PrismaAuthRepository } from "./auth/PrismaAuthRepository";
export { DrizzleAuthRepository } from "./auth/DrizzleAuthRepository";

export { EnvInterestRateProvider } from "./accounts/EnvInterestRateProvider";
export { PrismaInterestRateProvider } from "./accounts/PrismaInterestRateProvider";
export { PrismaAccountRepository } from "./accounts/PrismaAccountRepository";
export { PrismaTransferRepository } from "./accounts/PrismaTransferRepository";
export { PrismaSavingsRateRepository } from "./accounts/PrismaSavingsRateRepository";
export { PrismaSavingsInterestRepository } from "./accounts/PrismaSavingsInterestRepository";
export { DrizzleAccountRepository } from "./accounts/DrizzleAccountRepository";
export { DrizzleTransferRepository } from "./accounts/DrizzleTransferRepository";
export { DrizzleSavingsRateRepository } from "./accounts/DrizzleSavingsRateRepository";
export { DrizzleSavingsInterestRepository } from "./accounts/DrizzleSavingsInterestRepository";

export { PrismaActionRepository } from "./actions/PrismaActionRepository";
export { PrismaActionTradeRepository } from "./actions/PrismaActionTradeRepository";
export { PrismaPortfolioRepository } from "./actions/PrismaPortfolioRepository";
export { DrizzleActionRepository } from "./actions/DrizzleActionRepository";
export { DrizzleActionTradeRepository } from "./actions/DrizzleActionTradeRepository";
export { DrizzlePortfolioRepository } from "./actions/DrizzlePortfolioRepository";

export { PrismaCreditRepository } from "./credits/PrismaCreditRepository";
export { DrizzleCreditRepository } from "./credits/DrizzleCreditRepository";

export { PrismaUserAdminRepository } from "./users/PrismaUserAdminRepository";
export { PrismaUserQueryRepository } from "./users/PrismaUserQueryRepository";
export { DrizzleUserAdminRepository } from "./users/DrizzleUserAdminRepository";
export { DrizzleUserQueryRepository } from "./users/DrizzleUserQueryRepository";

export { PrismaNewsRepository } from "./news/PrismaNewsRepository";
export { DrizzleNewsRepository } from "./news/DrizzleNewsRepository";

export { PrismaNotificationRepository } from "./notifications/PrismaNotificationRepository";
export { DrizzleNotificationRepository } from "./notifications/DrizzleNotificationRepository";
export { InMemoryNotificationStream, createNotificationStream } from "./notifications/InMemoryNotificationStream";

export { PrismaGroupChatRepository } from "./chat/PrismaGroupChatRepository";
export { DrizzleGroupChatRepository } from "./chat/DrizzleGroupChatRepository";
export { PrismaDiscussionRepository } from "./chat/PrismaDiscussionRepository";
export { DrizzleDiscussionRepository } from "./chat/DrizzleDiscussionRepository";
export { PrismaMessageRepository } from "./chat/PrismaMessageRepository";
export { DrizzleMessageRepository } from "./chat/DrizzleMessageRepository";
export { PrismaAdvisorRepository } from "./chat/PrismaAdvisorRepository";
export { DrizzleAdvisorRepository } from "./chat/DrizzleAdvisorRepository";
export { HttpChatEvents } from "./chat/HttpChatEvents";

export { LocalSocketActionStockNotifier } from "./notifications/LocalSocketActionStockNotifier";
export { LocalSocketSavingsRateNotifier } from "./notifications/LocalSocketSavingsRateNotifier";

export { resolveDbDriver } from "./db/driver";
export * from "./db/repositories";
export { getDrizzleDb } from "./db/drizzle/client";
export { newId } from "./db/drizzle/ids";
export { accounts, notifications } from "./db/drizzle/schema";
