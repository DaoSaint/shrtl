import { Hono } from "hono";
import { getConnInfo } from "hono/bun";
import type { Context } from "hono";
import type { Db } from "@/lib/db/client.ts";
import { owner, passwordMatches } from "@/lib/account.ts";
import { createRateLimit } from "@/lib/rate-limit.ts";
import { attachSession, currentUser, startSession } from "@/lib/session.ts";
import { document } from "@/views/layout.tsx";
import { LoginPage } from "@/views/login.tsx";

const LIMIT = 5;
const WINDOW_MS = 15 * 60 * 1000;

const clientKey = (c: Context) => {
    if (process.env.TRUST_PROXY === "1") {
        const forwarded = c.req.header("x-forwarded-for")?.split(",")[0]?.trim();
        if (forwarded) return forwarded;
    }

    try {
        return getConnInfo(c).remote.address ?? "local";
    } catch {
        return "local";
    }
};

export const loginRoutes = (
    db: Db,
    limit = createRateLimit({ limit: LIMIT, windowMs: WINDOW_MS }),
) => {
    const routes = new Hono();

    routes.get("/", async (c) =>
        (await currentUser(db, c)) ? c.redirect("/") : c.html(await document(<LoginPage />)),
    );

    routes.post("/", async (c) => {
        const account = await owner(db);
        if (!account) return c.redirect("/setup", 303);

        const key = clientKey(c);
        const wait = limit.wait(key);
        if (wait > 0) {
            c.header("retry-after", String(wait));
            return c.html(
                await document(<LoginPage error={`Too many attempts. Retry in ${wait}s.`} />),
                429,
            );
        }

        const body = await c.req.parseBody();
        const password = typeof body.password === "string" ? body.password : "";

        if (!(await passwordMatches(account.passwordHash, password))) {
            limit.fail(key);
            return c.html(
                await document(<LoginPage error="Invalid password." errorField="password" />),
                422,
            );
        }

        limit.clear(key);

        const { token, expiresAt } = await startSession(db, account.id);
        attachSession(c, token, expiresAt);

        return c.redirect("/", 303);
    });

    return routes;
};
