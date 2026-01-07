import { sql } from "drizzle-orm";
import {
    boolean,
    datetime,
    decimal,
    index,
    int,
    mysqlEnum,
    mysqlTable,
    text,
    uniqueIndex,
    varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable(
    "User",
    {
        id: varchar("id", { length: 191 }).primaryKey(),
        email: varchar("email", { length: 191 }).notNull(),
        name: varchar("name", { length: 191 }).notNull(),
        password: varchar("password", { length: 191 }).notNull(),
        role: mysqlEnum("role", ["CLIENT", "DIRECTOR", "ADVISOR"]).notNull().default("CLIENT"),
        isActive: boolean("isActive").notNull().default(false),
        confirmationToken: varchar("confirmationToken", { length: 191 }),
        confirmationTokenExpiresAt: datetime("confirmationTokenExpiresAt"),
        bannedAt: datetime("bannedAt"),
        createdAt: datetime("createdAt").notNull().default(sql`CURRENT_TIMESTAMP`),
        updatedAt: datetime("updatedAt")
            .notNull()
            .default(sql`CURRENT_TIMESTAMP`)
            .$onUpdateFn(() => new Date()),
    },
    (t) => ({
        emailIdx: uniqueIndex("User_email_key").on(t.email),
        confirmationTokenIdx: uniqueIndex("User_confirmationToken_key").on(t.confirmationToken),
        roleIdx: index("User_role_idx").on(t.role),
        activeIdx: index("User_isActive_idx").on(t.isActive),
    }),
);

export const emailConfirmationTokens = mysqlTable(
    "EmailConfirmationToken",
    {
        id: varchar("id", { length: 191 }).primaryKey(),
        token: varchar("token", { length: 191 }).notNull(),
        userId: varchar("userId", { length: 191 }).notNull(),
        expiresAt: datetime("expiresAt").notNull(),
        usedAt: datetime("usedAt"),
        createdAt: datetime("createdAt").notNull().default(sql`CURRENT_TIMESTAMP`),
    },
    (t) => ({
        tokenIdx: uniqueIndex("EmailConfirmationToken_token_key").on(t.token),
        userIdx: index("EmailConfirmationToken_userId_idx").on(t.userId),
    }),
);

export const accounts = mysqlTable(
    "Account",
    {
        id: varchar("id", { length: 191 }).primaryKey(),
        userId: varchar("userId", { length: 191 }).notNull(),
        iban: varchar("iban", { length: 191 }).notNull(),
        name: varchar("name", { length: 191 }).notNull(),
        type: mysqlEnum("type", ["CURRENT", "SAVINGS"]).notNull().default("CURRENT"),
        balance: decimal("balance", { precision: 19, scale: 4 }).notNull().default("0"),
        isActive: boolean("isActive").notNull().default(true),
        createdAt: datetime("createdAt").notNull().default(sql`CURRENT_TIMESTAMP`),
        updatedAt: datetime("updatedAt")
            .notNull()
            .default(sql`CURRENT_TIMESTAMP`)
            .$onUpdateFn(() => new Date()),
    },
    (t) => ({
        ibanIdx: uniqueIndex("Account_iban_key").on(t.iban),
        userIdx: index("Account_userId_idx").on(t.userId),
        typeIdx: index("Account_type_idx").on(t.type),
    }),
);

export const transfers = mysqlTable(
    "Transfer",
    {
        id: varchar("id", { length: 191 }).primaryKey(),
        sourceAccountId: varchar("sourceAccountId", { length: 191 }).notNull(),
        destAccountId: varchar("destAccountId", { length: 191 }).notNull(),
        amount: decimal("amount", { precision: 19, scale: 4 }).notNull(),
        note: text("note"),
        createdAt: datetime("createdAt").notNull().default(sql`CURRENT_TIMESTAMP`),
    },
    (t) => ({
        sourceIdx: index("Transfer_sourceAccountId_idx").on(t.sourceAccountId),
        destIdx: index("Transfer_destAccountId_idx").on(t.destAccountId),
    }),
);

export const operations = mysqlTable(
    "Operation",
    {
        id: varchar("id", { length: 191 }).primaryKey(),
        accountId: varchar("accountId", { length: 191 }).notNull(),
        kind: mysqlEnum("kind", ["DEBIT", "CREDIT"]).notNull(),
        amount: decimal("amount", { precision: 19, scale: 4 }).notNull(),
        createdAt: datetime("createdAt").notNull().default(sql`CURRENT_TIMESTAMP`),
        transferId: varchar("transferId", { length: 191 }),
        metadata: text("metadata"),
    },
    (t) => ({
        accountIdx: index("Operation_accountId_idx").on(t.accountId),
        transferIdx: index("Operation_transferId_idx").on(t.transferId),
        createdIdx: index("Operation_createdAt_idx").on(t.createdAt),
    }),
);

export const tauxEpargne = mysqlTable(
    "TauxEpargne",
    {
        id: varchar("id", { length: 191 }).primaryKey(),
        rate: decimal("rate", { precision: 9, scale: 6 }).notNull(),
        active: boolean("active").notNull().default(true),
        createdAt: datetime("createdAt").notNull().default(sql`CURRENT_TIMESTAMP`),
        updatedAt: datetime("updatedAt")
            .notNull()
            .default(sql`CURRENT_TIMESTAMP`)
            .$onUpdateFn(() => new Date()),
    },
    (t) => ({
        activeIdx: index("TauxEpargne_active_idx").on(t.active),
    }),
);

export const interestAccrual = mysqlTable(
    "InterestAccrual",
    {
        id: varchar("id", { length: 191 }).primaryKey(),
        accountId: varchar("accountId", { length: 191 }).notNull(),
        rateId: varchar("rateId", { length: 191 }).notNull(),
        amount: decimal("amount", { precision: 19, scale: 4 }).notNull(),
        accruedDate: datetime("accruedDate").notNull().default(sql`CURRENT_TIMESTAMP`),
    },
    (t) => ({
        accountIdx: index("InterestAccrual_accountId_idx").on(t.accountId),
        rateIdx: index("InterestAccrual_rateId_idx").on(t.rateId),
    }),
);

export const actions = mysqlTable(
    "Action",
    {
        id: varchar("id", { length: 191 }).primaryKey(),
        symbol: varchar("symbol", { length: 191 }).notNull(),
        name: varchar("name", { length: 191 }).notNull(),
        price: decimal("price", { precision: 19, scale: 4 }).notNull().default("0"),
        availableStock: decimal("availableStock", { precision: 19, scale: 4 }).notNull().default("0"),
        isAvailable: boolean("isAvailable").notNull().default(true),
        createdAt: datetime("createdAt").notNull().default(sql`CURRENT_TIMESTAMP`),
        updatedAt: datetime("updatedAt")
            .notNull()
            .default(sql`CURRENT_TIMESTAMP`)
            .$onUpdateFn(() => new Date()),
    },
    (t) => ({
        symbolIdx: uniqueIndex("Action_symbol_key").on(t.symbol),
    }),
);

export const orders = mysqlTable(
    "Order",
    {
        id: varchar("id", { length: 191 }).primaryKey(),
        userId: varchar("userId", { length: 191 }).notNull(),
        actionId: varchar("actionId", { length: 191 }).notNull(),
        side: mysqlEnum("side", ["BUY", "SELL"]).notNull(),
        quantity: decimal("quantity", { precision: 19, scale: 4 }).notNull(),
        limitPrice: decimal("limitPrice", { precision: 19, scale: 4 }),
        status: mysqlEnum("status", ["OPEN", "FILLED", "CANCELED"]).notNull().default("OPEN"),
        fee: decimal("fee", { precision: 19, scale: 4 }).notNull().default("1"),
        createdAt: datetime("createdAt").notNull().default(sql`CURRENT_TIMESTAMP`),
        filledAt: datetime("filledAt"),
    },
    (t) => ({
        userIdx: index("Order_userId_idx").on(t.userId),
        actionIdx: index("Order_actionId_idx").on(t.actionId),
        statusIdx: index("Order_status_idx").on(t.status),
    }),
);

export const portfolio = mysqlTable(
    "Portfolio",
    {
        id: varchar("id", { length: 191 }).primaryKey(),
        userId: varchar("userId", { length: 191 }).notNull(),
        actionId: varchar("actionId", { length: 191 }).notNull(),
        quantity: decimal("quantity", { precision: 19, scale: 4 }).notNull().default("0"),
        avgPrice: decimal("avgPrice", { precision: 19, scale: 4 }).notNull().default("0"),
        updatedAt: datetime("updatedAt")
            .notNull()
            .default(sql`CURRENT_TIMESTAMP`)
            .$onUpdateFn(() => new Date()),
    },
    (t) => ({
        uniqueIdx: uniqueIndex("Portfolio_userId_actionId_key").on(t.userId, t.actionId),
    }),
);

export const credits = mysqlTable(
    "Credit",
    {
        id: varchar("id", { length: 191 }).primaryKey(),
        userId: varchar("userId", { length: 191 }).notNull(),
        principal: decimal("principal", { precision: 19, scale: 4 }).notNull(),
        initialPrincipal: decimal("initialPrincipal", { precision: 19, scale: 4 }).notNull(),
        remainingPrincipal: decimal("remainingPrincipal", { precision: 19, scale: 4 }).notNull(),
        annualRate: decimal("annualRate", { precision: 9, scale: 6 }).notNull(),
        insuranceRate: decimal("insuranceRate", { precision: 9, scale: 6 }).notNull(),
        termMonths: int("termMonths").notNull(),
        remainingTermMonths: int("remainingTermMonths").notNull(),
        monthlyDue: decimal("monthlyDue", { precision: 19, scale: 4 }).notNull(),
        monthlyInsurance: decimal("monthlyInsurance", { precision: 19, scale: 4 }).notNull(),
        status: mysqlEnum("status", ["PENDING", "ACTIVE", "REPAID", "CANCELED"]).notNull().default("PENDING"),
        createdAt: datetime("createdAt").notNull().default(sql`CURRENT_TIMESTAMP`),
        activatedAt: datetime("activatedAt"),
        repaidAt: datetime("repaidAt"),
    },
    (t) => ({
        userIdx: index("Credit_userId_idx").on(t.userId),
        createdIdx: index("Credit_createdAt_idx").on(t.createdAt),
    }),
);

export const discussions = mysqlTable(
    "Discussion",
    {
        id: varchar("id", { length: 191 }).primaryKey(),
        ownerId: varchar("ownerId", { length: 191 }).notNull(),
        assignedAdvisorId: varchar("assignedAdvisorId", { length: 191 }),
        title: varchar("title", { length: 255 }),
        createdAt: datetime("createdAt").notNull().default(sql`CURRENT_TIMESTAMP`),
        updatedAt: datetime("updatedAt")
            .notNull()
            .default(sql`CURRENT_TIMESTAMP`)
            .$onUpdateFn(() => new Date()),
    },
    (t) => ({
        assignedIdx: index("Discussion_assignedAdvisorId_idx").on(t.assignedAdvisorId),
    }),
);

export const discussionParticipants = mysqlTable(
    "DiscussionParticipant",
    {
        id: varchar("id", { length: 191 }).primaryKey(),
        userId: varchar("userId", { length: 191 }).notNull(),
        discussionId: varchar("discussionId", { length: 191 }).notNull(),
        joinedAt: datetime("joinedAt").notNull().default(sql`CURRENT_TIMESTAMP`),
    },
    (t) => ({
        uniqueIdx: uniqueIndex("DiscussionParticipant_userId_discussionId_key").on(t.userId, t.discussionId),
    }),
);

export const messages = mysqlTable(
    "Message",
    {
        id: varchar("id", { length: 191 }).primaryKey(),
        discussionId: varchar("discussionId", { length: 191 }).notNull(),
        senderId: varchar("senderId", { length: 191 }).notNull(),
        content: text("content").notNull(),
        createdAt: datetime("createdAt").notNull().default(sql`CURRENT_TIMESTAMP`),
        transferredToAdvisorId: varchar("transferredToAdvisorId", { length: 191 }),
    },
);

export const notifications = mysqlTable(
    "Notification",
    {
        id: varchar("id", { length: 191 }).primaryKey(),
        userId: varchar("userId", { length: 191 }).notNull(),
        title: varchar("title", { length: 191 }).notNull(),
        body: text("body"),
        readAt: datetime("readAt"),
        createdAt: datetime("createdAt").notNull().default(sql`CURRENT_TIMESTAMP`),
    },
    (t) => ({
        userReadIdx: index("Notification_userId_readAt_idx").on(t.userId, t.readAt),
    }),
);

export type DbSchema = {
    users: typeof users;
    emailConfirmationTokens: typeof emailConfirmationTokens;
    accounts: typeof accounts;
    transfers: typeof transfers;
    operations: typeof operations;
    tauxEpargne: typeof tauxEpargne;
    interestAccrual: typeof interestAccrual;
    actions: typeof actions;
    orders: typeof orders;
    portfolio: typeof portfolio;
    credits: typeof credits;
    discussions: typeof discussions;
    discussionParticipants: typeof discussionParticipants;
    messages: typeof messages;
    notifications: typeof notifications;
};
