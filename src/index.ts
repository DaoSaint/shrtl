import { createApp } from "@/app.tsx";
import { createDb } from "@/lib/db/client.ts";
import { runMigrations } from "@/lib/db/migrate.ts";

const db = createDb();
runMigrations(db);

const port = Number(process.env.PORT ?? 3000);
const hostname = process.env.HOST ?? "0.0.0.0";

Bun.serve({ port, hostname, fetch: createApp(db).fetch });
console.log(`shrtl listening on http://${hostname}:${port}`);
