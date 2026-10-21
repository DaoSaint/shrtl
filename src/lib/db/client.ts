import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "./schema.ts";

export const createDb = (path = process.env.DATABASE_PATH ?? "./data/shrtl.db") => {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });

    const sqlite = new Database(path, { create: true });
    sqlite.run("PRAGMA journal_mode = WAL");
    sqlite.run("PRAGMA foreign_keys = ON");
    return drizzle(sqlite, { schema });
};

export type Db = ReturnType<typeof createDb>;
