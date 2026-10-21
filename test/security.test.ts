import { test } from "node:test";
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { sessions } from "@/lib/db/schema.ts";
import { PASSWORD, postForm, sessionCookie, testApp, withAccount } from "./helpers.ts";

test("every response carries the security headers", async () => {
    const { app } = testApp();
    const res = await app.request("/login");

    assert.equal(res.headers.get("x-content-type-options"), "nosniff");
    assert.equal(res.headers.get("x-frame-options"), "DENY");
    assert.equal(res.headers.get("referrer-policy"), "no-referrer");

    const csp = res.headers.get("content-security-policy") ?? "";
    assert.match(csp, /default-src 'self'/);
    assert.match(csp, /frame-ancestors 'none'/);
    assert.match(csp, /form-action 'self'/);
});

test("the session cookie is secure when the request came through https", async () => {
    const { app } = await withAccount();
    const res = await app.request("/login", {
        ...postForm({ password: PASSWORD }),
        headers: {
            "content-type": "application/x-www-form-urlencoded",
            "x-forwarded-proto": "https",
        },
    });

    assert.match(res.headers.get("set-cookie")!, /Secure/);
});

test("oversized bodies are rejected", async () => {
    const { app } = await withAccount();
    const res = await app.request("/login", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: `password=${"a".repeat(40 * 1024)}`,
    });

    assert.equal(res.status, 413);
});

test("expired sessions are refused and swept on the next login", async () => {
    const { app, db } = await withAccount();
    await db.insert(sessions).values({
        id: "stale",
        userId: 1,
        expiresAt: new Date(Date.now() - 1000).toISOString(),
    });

    const denied = await app.request("/", { headers: { cookie: "sid=stale" } });
    assert.equal(denied.status, 302);
    assert.equal(denied.headers.get("location"), "/login");

    const login = await app.request("/login", postForm({ password: PASSWORD }));
    assert.equal(login.status, 303);
    assert.equal((await db.select().from(sessions).where(eq(sessions.id, "stale"))).length, 0);
});

test("the dashboard is not cacheable", async () => {
    const { app } = await withAccount();
    const login = await app.request("/login", postForm({ password: PASSWORD }));
    const res = await app.request("/", { headers: { cookie: sessionCookie(login)! } });

    assert.equal(res.headers.get("cache-control"), "no-store");
});

test("a hostile path is escaped in the 404 page", async () => {
    const { app } = testApp();
    const res = await app.request("/p/<script>alert(1)</script>");
    const body = await res.text();

    assert.equal(res.status, 404);
    assert.equal(body.includes("<script>alert(1)</script>"), false);
    assert.match(body, /&lt;script&gt;/);
});

test("static assets are not served from outside public", async () => {
    const { app } = testApp();
    const res = await app.request("/dashboard.js/../package.json");

    assert.notEqual(res.status, 200);
});
