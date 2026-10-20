import { app } from "./app.ts";

const port = Number(process.env.PORT ?? 3000);
const hostname = process.env.HOST ?? "0.0.0.0";

Bun.serve({ port, hostname, fetch: app.fetch });
console.log(`shrtl listening on http://${hostname}:${port}`);
