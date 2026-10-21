import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { secureHeaders } from "hono/secure-headers";
import { serveStatic } from "hono/bun";
import type { Db } from "@/lib/db/client.ts";
import { homeRoutes } from "@/routes/home.tsx";
import { loginRoutes } from "@/routes/login.tsx";
import { linkRoutes } from "@/routes/links.tsx";
import { redirectHandler } from "@/routes/redirect.ts";
import { setupRoutes } from "@/routes/setup.tsx";
import { document } from "@/views/layout.tsx";
import { NotFoundPage } from "@/views/not-found.tsx";

export const createApp = (db: Db) => {
    const app = new Hono();

    app.use(
        secureHeaders({
            xFrameOptions: "DENY",
            contentSecurityPolicy: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:"],
                baseUri: ["'none'"],
                formAction: ["'self'"],
                frameAncestors: ["'none'"],
            },
        }),
    );
    app.use(bodyLimit({ maxSize: 32 * 1024 }));

    app.use("/uno.css", serveStatic({ root: "./public" }));
    app.use("/dashboard.js", serveStatic({ root: "./public" }));

    app.get("/healthz", (c) => c.json({ status: "ok" }));
    app.route("/", homeRoutes(db));
    app.route("/login", loginRoutes(db));
    app.route("/setup", setupRoutes(db));
    app.route("/links", linkRoutes(db));
    app.get("/p/:slug", redirectHandler(db, "public"));
    app.get("/r/:slug", redirectHandler(db, "private"));

    app.notFound(async (c) => c.html(await document(<NotFoundPage path={c.req.path} />), 404));

    return app;
};
