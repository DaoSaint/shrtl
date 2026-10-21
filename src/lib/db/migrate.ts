import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import type { Db } from "./client.ts";

export const runMigrations = (db: Db, folder = "./drizzle") => {
    migrate(db, { migrationsFolder: folder });
};

if (import.meta.main) {
    const { createDb } = await import("@/lib/db/client.ts");
    runMigrations(createDb());
    console.log("migrations applied");
}
