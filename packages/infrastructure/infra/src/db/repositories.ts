import { DbDriver } from "@proj/application/ports/DbHealth.port";
import { AuthRepository } from "@proj/domain/auth/ports/AuthRepository";
import { UserAdminRepository } from "@proj/domain/users/ports/UserAdminRepository";
import { UserQueryRepository } from "@proj/domain/users/ports/UserQueryRepository";
import { AccountRepository } from "@proj/domain/accounts/ports/AccountRepository";
import { TransferRepository } from "@proj/domain/accounts/ports/TransferRepository";
import { SavingsRateRepository } from "@proj/domain/accounts/ports/SavingsRateRepository";
import { SavingsInterestRepository } from "@proj/domain/accounts/ports/SavingsInterestRepository";
import { CreditRepository } from "@proj/domain/credits/ports/CreditRepository";
import { ActionRepository } from "@proj/domain/actions/ports/ActionRepository";
import { PortfolioRepository } from "@proj/domain/actions/ports/PortfolioRepository";
import { ActionTradeRepository } from "@proj/domain/actions/ports/ActionTradeRepository";

import { PrismaAuthRepository } from "../auth/PrismaAuthRepository";
import { PrismaUserAdminRepository } from "../users/PrismaUserAdminRepository";
import { PrismaUserQueryRepository } from "../users/PrismaUserQueryRepository";
import { PrismaAccountRepository } from "../accounts/PrismaAccountRepository";
import { PrismaTransferRepository } from "../accounts/PrismaTransferRepository";
import { PrismaSavingsRateRepository } from "../accounts/PrismaSavingsRateRepository";
import { PrismaSavingsInterestRepository } from "../accounts/PrismaSavingsInterestRepository";
import { PrismaCreditRepository } from "../credits/PrismaCreditRepository";
import { PrismaActionRepository } from "../actions/PrismaActionRepository";
import { PrismaPortfolioRepository } from "../actions/PrismaPortfolioRepository";
import { PrismaActionTradeRepository } from "../actions/PrismaActionTradeRepository";

import { DrizzleAuthRepository } from "../auth/DrizzleAuthRepository";
import { DrizzleUserAdminRepository } from "../users/DrizzleUserAdminRepository";
import { DrizzleUserQueryRepository } from "../users/DrizzleUserQueryRepository";
import { DrizzleAccountRepository } from "../accounts/DrizzleAccountRepository";
import { DrizzleTransferRepository } from "../accounts/DrizzleTransferRepository";
import { DrizzleSavingsRateRepository } from "../accounts/DrizzleSavingsRateRepository";
import { DrizzleSavingsInterestRepository } from "../accounts/DrizzleSavingsInterestRepository";
import { DrizzleCreditRepository } from "../credits/DrizzleCreditRepository";
import { DrizzleActionRepository } from "../actions/DrizzleActionRepository";
import { DrizzlePortfolioRepository } from "../actions/DrizzlePortfolioRepository";
import { DrizzleActionTradeRepository } from "../actions/DrizzleActionTradeRepository";
import { resolveDbDriver } from "./driver";

function normalize(driver?: DbDriver): DbDriver {
    return driver ?? resolveDbDriver();
}

export function createAuthRepository(
    driver?: DbDriver,
    options?: { createDefaultAccount?: boolean },
): AuthRepository {
    const db = normalize(driver);
    if (db === "mariadb") return new DrizzleAuthRepository(options);
    return new PrismaAuthRepository(undefined, options);
}

export function createUserQueryRepository(driver?: DbDriver): UserQueryRepository {
    const db = normalize(driver);
    if (db === "mariadb") return new DrizzleUserQueryRepository();
    return new PrismaUserQueryRepository();
}

export function createUserAdminRepository(driver?: DbDriver): UserAdminRepository {
    const db = normalize(driver);
    if (db === "mariadb") return new DrizzleUserAdminRepository();
    return new PrismaUserAdminRepository();
}

export function createAccountRepository(driver?: DbDriver): AccountRepository {
    const db = normalize(driver);
    if (db === "mariadb") return new DrizzleAccountRepository();
    return new PrismaAccountRepository();
}

export function createTransferRepository(driver?: DbDriver): TransferRepository {
    const db = normalize(driver);
    if (db === "mariadb") return new DrizzleTransferRepository();
    return new PrismaTransferRepository();
}

export function createSavingsRateRepository(driver?: DbDriver): SavingsRateRepository {
    const db = normalize(driver);
    if (db === "mariadb") return new DrizzleSavingsRateRepository();
    return new PrismaSavingsRateRepository();
}

export function createSavingsInterestRepository(driver?: DbDriver): SavingsInterestRepository {
    const db = normalize(driver);
    if (db === "mariadb") return new DrizzleSavingsInterestRepository();
    return new PrismaSavingsInterestRepository();
}

export function createCreditRepository(driver?: DbDriver): CreditRepository {
    const db = normalize(driver);
    if (db === "mariadb") return new DrizzleCreditRepository();
    return new PrismaCreditRepository();
}

export function createActionRepository(driver?: DbDriver): ActionRepository {
    const db = normalize(driver);
    if (db === "mariadb") return new DrizzleActionRepository();
    return new PrismaActionRepository();
}

export function createPortfolioRepository(driver?: DbDriver): PortfolioRepository {
    const db = normalize(driver);
    if (db === "mariadb") return new DrizzlePortfolioRepository();
    return new PrismaPortfolioRepository();
}

export function createActionTradeRepository(driver?: DbDriver): ActionTradeRepository {
    const db = normalize(driver);
    if (db === "mariadb") return new DrizzleActionTradeRepository();
    return new PrismaActionTradeRepository();
}
