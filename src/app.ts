import { Hono } from "hono";

export const app = new Hono();

app.get("/healthz", (c) => c.json({ status: "ok" }));
