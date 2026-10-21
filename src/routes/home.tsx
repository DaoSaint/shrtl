import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import type { Db } from "@/lib/db/client.ts";
import { ownerExists } from "@/lib/account.ts";
import { listLinks, PAGE_SIZE, type Visibility } from "@/lib/links.ts";
import { clearSession, currentUser, endSession, SESSION_COOKIE } from "@/lib/session.ts";
import { document } from "@/views/layout.tsx";
import { DashboardPage } from "@/views/dashboard.tsx";

const stateOf = (value: string | undefined): Visibility | undefined =>
    value === "public" || value === "private" ? value : undefined;

export const homeRoutes = (db: Db) => {
    const routes = new Hono();

    routes.get("/", async (c) => {
        if (!(await ownerExists(db))) return c.redirect("/setup");

        const user = await currentUser(db, c);
        if (!user) return c.redirect("/login");

        c.header("cache-control", "no-store");

        const q = c.req.query("q") ?? "";
        const visibility = stateOf(c.req.query("state"));
        const { items, hasMore } = await listLinks(
            db,
            { q, visibility },
            { limit: PAGE_SIZE, offset: 0 },
        );

        return c.html(
            await document(
                <DashboardPage
                    username={user.username}
                    links={items}
                    query={q}
                    state={visibility ?? "all"}
                    next={hasMore ? items.length : null}
                />,
            ),
        );
    });

    routes.post("/logout", async (c) => {
        const token = getCookie(c, SESSION_COOKIE);
        if (token) await endSession(db, token);
        clearSession(c);
        return c.redirect("/login", 303);
    });

    return routes;
};
