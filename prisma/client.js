"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDrizzleDb = getDrizzleDb;
exports.closeDrizzleDb = closeDrizzleDb;
const mysql2_1 = require("drizzle-orm/mysql2");
const promise_1 = require("mysql2/promise");
const schema = __importStar(require("./schema"));
let pool = null;
let db = null;
function getDrizzleDb() {
    if (db)
        return db;
    const url = process.env.DATABASE_URL;
    if (!url) {
        throw new Error("DATABASE_URL is required for MariaDB/Drizzle");
    }
    pool = (0, promise_1.createPool)(url);
    db = (0, mysql2_1.drizzle)(pool, { schema, mode: "default" });
    return db;
}
async function closeDrizzleDb() {
    if (!pool)
        return;
    await pool.end();
    pool = null;
    db = null;
}
