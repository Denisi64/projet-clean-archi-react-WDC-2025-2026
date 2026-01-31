"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.news = exports.notifications = exports.messages = exports.discussionParticipants = exports.discussions = exports.credits = exports.portfolio = exports.orders = exports.actions = exports.interestAccrual = exports.tauxEpargne = exports.operations = exports.transfers = exports.accounts = exports.emailConfirmationTokens = exports.users = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const mysql_core_1 = require("drizzle-orm/mysql-core");
exports.users = (0, mysql_core_1.mysqlTable)("User", {
    id: (0, mysql_core_1.varchar)("id", { length: 191 }).primaryKey(),
    email: (0, mysql_core_1.varchar)("email", { length: 191 }).notNull(),
    name: (0, mysql_core_1.varchar)("name", { length: 191 }).notNull(),
    password: (0, mysql_core_1.varchar)("password", { length: 191 }).notNull(),
    role: (0, mysql_core_1.mysqlEnum)("role", ["CLIENT", "DIRECTOR", "ADVISOR"]).notNull().default("CLIENT"),
    isActive: (0, mysql_core_1.boolean)("isActive").notNull().default(false),
    confirmationToken: (0, mysql_core_1.varchar)("confirmationToken", { length: 191 }),
    confirmationTokenExpiresAt: (0, mysql_core_1.datetime)("confirmationTokenExpiresAt"),
    bannedAt: (0, mysql_core_1.datetime)("bannedAt"),
    createdAt: (0, mysql_core_1.datetime)("createdAt").notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
    updatedAt: (0, mysql_core_1.datetime)("updatedAt")
        .notNull()
        .default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`)
        .$onUpdateFn(() => new Date()),
}, (t) => ({
    emailIdx: (0, mysql_core_1.uniqueIndex)("User_email_key").on(t.email),
    confirmationTokenIdx: (0, mysql_core_1.uniqueIndex)("User_confirmationToken_key").on(t.confirmationToken),
    roleIdx: (0, mysql_core_1.index)("User_role_idx").on(t.role),
    activeIdx: (0, mysql_core_1.index)("User_isActive_idx").on(t.isActive),
}));
exports.emailConfirmationTokens = (0, mysql_core_1.mysqlTable)("EmailConfirmationToken", {
    id: (0, mysql_core_1.varchar)("id", { length: 191 }).primaryKey(),
    token: (0, mysql_core_1.varchar)("token", { length: 191 }).notNull(),
    userId: (0, mysql_core_1.varchar)("userId", { length: 191 }).notNull(),
    expiresAt: (0, mysql_core_1.datetime)("expiresAt").notNull(),
    usedAt: (0, mysql_core_1.datetime)("usedAt"),
    createdAt: (0, mysql_core_1.datetime)("createdAt").notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
}, (t) => ({
    tokenIdx: (0, mysql_core_1.uniqueIndex)("EmailConfirmationToken_token_key").on(t.token),
    userIdx: (0, mysql_core_1.index)("EmailConfirmationToken_userId_idx").on(t.userId),
}));
exports.accounts = (0, mysql_core_1.mysqlTable)("Account", {
    id: (0, mysql_core_1.varchar)("id", { length: 191 }).primaryKey(),
    userId: (0, mysql_core_1.varchar)("userId", { length: 191 }).notNull(),
    iban: (0, mysql_core_1.varchar)("iban", { length: 191 }).notNull(),
    name: (0, mysql_core_1.varchar)("name", { length: 191 }).notNull(),
    type: (0, mysql_core_1.mysqlEnum)("type", ["CURRENT", "SAVINGS"]).notNull().default("CURRENT"),
    balance: (0, mysql_core_1.decimal)("balance", { precision: 19, scale: 4 }).notNull().default("0"),
    isActive: (0, mysql_core_1.boolean)("isActive").notNull().default(true),
    createdAt: (0, mysql_core_1.datetime)("createdAt").notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
    updatedAt: (0, mysql_core_1.datetime)("updatedAt")
        .notNull()
        .default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`)
        .$onUpdateFn(() => new Date()),
}, (t) => ({
    ibanIdx: (0, mysql_core_1.uniqueIndex)("Account_iban_key").on(t.iban),
    userIdx: (0, mysql_core_1.index)("Account_userId_idx").on(t.userId),
    typeIdx: (0, mysql_core_1.index)("Account_type_idx").on(t.type),
}));
exports.transfers = (0, mysql_core_1.mysqlTable)("Transfer", {
    id: (0, mysql_core_1.varchar)("id", { length: 191 }).primaryKey(),
    sourceAccountId: (0, mysql_core_1.varchar)("sourceAccountId", { length: 191 }).notNull(),
    destAccountId: (0, mysql_core_1.varchar)("destAccountId", { length: 191 }).notNull(),
    amount: (0, mysql_core_1.decimal)("amount", { precision: 19, scale: 4 }).notNull(),
    note: (0, mysql_core_1.text)("note"),
    createdAt: (0, mysql_core_1.datetime)("createdAt").notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
}, (t) => ({
    sourceIdx: (0, mysql_core_1.index)("Transfer_sourceAccountId_idx").on(t.sourceAccountId),
    destIdx: (0, mysql_core_1.index)("Transfer_destAccountId_idx").on(t.destAccountId),
}));
exports.operations = (0, mysql_core_1.mysqlTable)("Operation", {
    id: (0, mysql_core_1.varchar)("id", { length: 191 }).primaryKey(),
    accountId: (0, mysql_core_1.varchar)("accountId", { length: 191 }).notNull(),
    kind: (0, mysql_core_1.mysqlEnum)("kind", ["DEBIT", "CREDIT"]).notNull(),
    amount: (0, mysql_core_1.decimal)("amount", { precision: 19, scale: 4 }).notNull(),
    createdAt: (0, mysql_core_1.datetime)("createdAt").notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
    transferId: (0, mysql_core_1.varchar)("transferId", { length: 191 }),
    metadata: (0, mysql_core_1.text)("metadata"),
}, (t) => ({
    accountIdx: (0, mysql_core_1.index)("Operation_accountId_idx").on(t.accountId),
    transferIdx: (0, mysql_core_1.index)("Operation_transferId_idx").on(t.transferId),
    createdIdx: (0, mysql_core_1.index)("Operation_createdAt_idx").on(t.createdAt),
}));
exports.tauxEpargne = (0, mysql_core_1.mysqlTable)("TauxEpargne", {
    id: (0, mysql_core_1.varchar)("id", { length: 191 }).primaryKey(),
    rate: (0, mysql_core_1.decimal)("rate", { precision: 9, scale: 6 }).notNull(),
    active: (0, mysql_core_1.boolean)("active").notNull().default(true),
    createdAt: (0, mysql_core_1.datetime)("createdAt").notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
    updatedAt: (0, mysql_core_1.datetime)("updatedAt")
        .notNull()
        .default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`)
        .$onUpdateFn(() => new Date()),
}, (t) => ({
    activeIdx: (0, mysql_core_1.index)("TauxEpargne_active_idx").on(t.active),
}));
exports.interestAccrual = (0, mysql_core_1.mysqlTable)("InterestAccrual", {
    id: (0, mysql_core_1.varchar)("id", { length: 191 }).primaryKey(),
    accountId: (0, mysql_core_1.varchar)("accountId", { length: 191 }).notNull(),
    rateId: (0, mysql_core_1.varchar)("rateId", { length: 191 }).notNull(),
    amount: (0, mysql_core_1.decimal)("amount", { precision: 19, scale: 4 }).notNull(),
    accruedDate: (0, mysql_core_1.datetime)("accruedDate").notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
}, (t) => ({
    accountIdx: (0, mysql_core_1.index)("InterestAccrual_accountId_idx").on(t.accountId),
    rateIdx: (0, mysql_core_1.index)("InterestAccrual_rateId_idx").on(t.rateId),
}));
exports.actions = (0, mysql_core_1.mysqlTable)("Action", {
    id: (0, mysql_core_1.varchar)("id", { length: 191 }).primaryKey(),
    symbol: (0, mysql_core_1.varchar)("symbol", { length: 191 }).notNull(),
    name: (0, mysql_core_1.varchar)("name", { length: 191 }).notNull(),
    price: (0, mysql_core_1.decimal)("price", { precision: 19, scale: 4 }).notNull().default("0"),
    availableStock: (0, mysql_core_1.decimal)("availableStock", { precision: 19, scale: 4 }).notNull().default("0"),
    isAvailable: (0, mysql_core_1.boolean)("isAvailable").notNull().default(true),
    createdAt: (0, mysql_core_1.datetime)("createdAt").notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
    updatedAt: (0, mysql_core_1.datetime)("updatedAt")
        .notNull()
        .default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`)
        .$onUpdateFn(() => new Date()),
}, (t) => ({
    symbolIdx: (0, mysql_core_1.uniqueIndex)("Action_symbol_key").on(t.symbol),
}));
exports.orders = (0, mysql_core_1.mysqlTable)("Order", {
    id: (0, mysql_core_1.varchar)("id", { length: 191 }).primaryKey(),
    userId: (0, mysql_core_1.varchar)("userId", { length: 191 }).notNull(),
    actionId: (0, mysql_core_1.varchar)("actionId", { length: 191 }).notNull(),
    side: (0, mysql_core_1.mysqlEnum)("side", ["BUY", "SELL"]).notNull(),
    quantity: (0, mysql_core_1.decimal)("quantity", { precision: 19, scale: 4 }).notNull(),
    limitPrice: (0, mysql_core_1.decimal)("limitPrice", { precision: 19, scale: 4 }),
    status: (0, mysql_core_1.mysqlEnum)("status", ["OPEN", "FILLED", "CANCELED"]).notNull().default("OPEN"),
    fee: (0, mysql_core_1.decimal)("fee", { precision: 19, scale: 4 }).notNull().default("1"),
    createdAt: (0, mysql_core_1.datetime)("createdAt").notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
    filledAt: (0, mysql_core_1.datetime)("filledAt"),
}, (t) => ({
    userIdx: (0, mysql_core_1.index)("Order_userId_idx").on(t.userId),
    actionIdx: (0, mysql_core_1.index)("Order_actionId_idx").on(t.actionId),
    statusIdx: (0, mysql_core_1.index)("Order_status_idx").on(t.status),
}));
exports.portfolio = (0, mysql_core_1.mysqlTable)("Portfolio", {
    id: (0, mysql_core_1.varchar)("id", { length: 191 }).primaryKey(),
    userId: (0, mysql_core_1.varchar)("userId", { length: 191 }).notNull(),
    actionId: (0, mysql_core_1.varchar)("actionId", { length: 191 }).notNull(),
    quantity: (0, mysql_core_1.decimal)("quantity", { precision: 19, scale: 4 }).notNull().default("0"),
    avgPrice: (0, mysql_core_1.decimal)("avgPrice", { precision: 19, scale: 4 }).notNull().default("0"),
    updatedAt: (0, mysql_core_1.datetime)("updatedAt")
        .notNull()
        .default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`)
        .$onUpdateFn(() => new Date()),
}, (t) => ({
    uniqueIdx: (0, mysql_core_1.uniqueIndex)("Portfolio_userId_actionId_key").on(t.userId, t.actionId),
}));
exports.credits = (0, mysql_core_1.mysqlTable)("Credit", {
    id: (0, mysql_core_1.varchar)("id", { length: 191 }).primaryKey(),
    userId: (0, mysql_core_1.varchar)("userId", { length: 191 }).notNull(),
    principal: (0, mysql_core_1.decimal)("principal", { precision: 19, scale: 4 }).notNull(),
    initialPrincipal: (0, mysql_core_1.decimal)("initialPrincipal", { precision: 19, scale: 4 }).notNull(),
    remainingPrincipal: (0, mysql_core_1.decimal)("remainingPrincipal", { precision: 19, scale: 4 }).notNull(),
    annualRate: (0, mysql_core_1.decimal)("annualRate", { precision: 9, scale: 6 }).notNull(),
    insuranceRate: (0, mysql_core_1.decimal)("insuranceRate", { precision: 9, scale: 6 }).notNull(),
    termMonths: (0, mysql_core_1.int)("termMonths").notNull(),
    remainingTermMonths: (0, mysql_core_1.int)("remainingTermMonths").notNull(),
    monthlyDue: (0, mysql_core_1.decimal)("monthlyDue", { precision: 19, scale: 4 }).notNull(),
    monthlyInsurance: (0, mysql_core_1.decimal)("monthlyInsurance", { precision: 19, scale: 4 }).notNull(),
    status: (0, mysql_core_1.mysqlEnum)("status", ["PENDING", "ACTIVE", "REPAID", "CANCELED"]).notNull().default("PENDING"),
    createdAt: (0, mysql_core_1.datetime)("createdAt").notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
    activatedAt: (0, mysql_core_1.datetime)("activatedAt"),
    repaidAt: (0, mysql_core_1.datetime)("repaidAt"),
}, (t) => ({
    userIdx: (0, mysql_core_1.index)("Credit_userId_idx").on(t.userId),
    createdIdx: (0, mysql_core_1.index)("Credit_createdAt_idx").on(t.createdAt),
}));
exports.discussions = (0, mysql_core_1.mysqlTable)("Discussion", {
    id: (0, mysql_core_1.varchar)("id", { length: 191 }).primaryKey(),
    ownerId: (0, mysql_core_1.varchar)("ownerId", { length: 191 }).notNull(),
    assignedAdvisorId: (0, mysql_core_1.varchar)("assignedAdvisorId", { length: 191 }),
    status: (0, mysql_core_1.varchar)("status", { length: 20 }).notNull().default("OPEN"),
    title: (0, mysql_core_1.varchar)("title", { length: 255 }),
    createdAt: (0, mysql_core_1.datetime)("createdAt").notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
    updatedAt: (0, mysql_core_1.datetime)("updatedAt")
        .notNull()
        .default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`)
        .$onUpdateFn(() => new Date()),
}, (t) => ({
    assignedIdx: (0, mysql_core_1.index)("Discussion_assignedAdvisorId_idx").on(t.assignedAdvisorId),
}));
exports.discussionParticipants = (0, mysql_core_1.mysqlTable)("DiscussionParticipant", {
    id: (0, mysql_core_1.varchar)("id", { length: 191 }).primaryKey(),
    userId: (0, mysql_core_1.varchar)("userId", { length: 191 }).notNull(),
    discussionId: (0, mysql_core_1.varchar)("discussionId", { length: 191 }).notNull(),
    joinedAt: (0, mysql_core_1.datetime)("joinedAt").notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
}, (t) => ({
    uniqueIdx: (0, mysql_core_1.uniqueIndex)("DiscussionParticipant_userId_discussionId_key").on(t.userId, t.discussionId),
}));
exports.messages = (0, mysql_core_1.mysqlTable)("Message", {
    id: (0, mysql_core_1.varchar)("id", { length: 191 }).primaryKey(),
    discussionId: (0, mysql_core_1.varchar)("discussionId", { length: 191 }).notNull(),
    senderId: (0, mysql_core_1.varchar)("senderId", { length: 191 }).notNull(),
    authorRole: (0, mysql_core_1.varchar)("authorRole", { length: 20 }).notNull().default("CLIENT"),
    content: (0, mysql_core_1.text)("content").notNull(),
    createdAt: (0, mysql_core_1.datetime)("createdAt").notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
    transferredToAdvisorId: (0, mysql_core_1.varchar)("transferredToAdvisorId", { length: 191 }),
});
exports.notifications = (0, mysql_core_1.mysqlTable)("Notification", {
    id: (0, mysql_core_1.varchar)("id", { length: 191 }).primaryKey(),
    userId: (0, mysql_core_1.varchar)("userId", { length: 191 }).notNull(),
    title: (0, mysql_core_1.varchar)("title", { length: 191 }).notNull(),
    body: (0, mysql_core_1.text)("body"),
    readAt: (0, mysql_core_1.datetime)("readAt"),
    createdAt: (0, mysql_core_1.datetime)("createdAt").notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
}, (t) => ({
    userReadIdx: (0, mysql_core_1.index)("Notification_userId_readAt_idx").on(t.userId, t.readAt),
}));
exports.news = (0, mysql_core_1.mysqlTable)("News", {
    id: (0, mysql_core_1.varchar)("id", { length: 191 }).primaryKey(),
    title: (0, mysql_core_1.varchar)("title", { length: 191 }).notNull(),
    body: (0, mysql_core_1.text)("body"),
    createdById: (0, mysql_core_1.varchar)("createdById", { length: 191 }).notNull(),
    createdAt: (0, mysql_core_1.datetime)("createdAt").notNull().default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
}, (t) => ({
    createdAtIdx: (0, mysql_core_1.index)("News_createdAt_idx").on(t.createdAt),
    createdByIdx: (0, mysql_core_1.index)("News_createdById_idx").on(t.createdById),
}));
