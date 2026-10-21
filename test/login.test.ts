import { test } from "node:test";
import assert from "node:assert/strict";
import { sessions } from "@/lib/db/schema.ts";
import { PASSWORD, postForm, sessionCookie, testApp, withAccount } from "./helpers.ts";

const password = PASSWORD;
const wrong = "wrong horse battery";

test("GET /login renders the form once an account exists", async () => {
    const { app } = await withAccount();
    const res = await app.request("/login");

    assert.equal(res.status, 200);
    assert.match(await res.text(), /login/);
});

test("GET /login redirects to / when already signed in", async () => {
    const { app } = await withAccount();
    const login = await app.request("/login", postForm({ password }));
    const cookie = sessionCookie(login)!;

    const res = await app.request("/login", { headers: { cookie } });
    assert.equal(res.status, 302);
    assert.equal(res.headers.get("location"), "/");
});

test("POST /login rejects a wrong password without creating a session", async () => {
    const { app, db } = await withAccount();
    const res = await app.request("/login", postForm({ password: wrong }));

    assert.equal(res.status, 422);
    assert.match(await res.text(), /Invalid password/);
    assert.equal((await db.select().from(sessions)).length, 0);
});

test("POST /login sets an http-only session cookie and redirects to /", async () => {
    const { app, db } = await withAccount();
    const res = await app.request("/login", postForm({ password }));

    assert.equal(res.status, 303);
    assert.equal(res.headers.get("location"), "/");
    assert.match(res.headers.get("set-cookie")!, /HttpOnly/);
    assert.match(res.headers.get("set-cookie")!, /SameSite=Lax/);

    const rows = await db.select().from(sessions);
    assert.equal(rows.length, 1);
    assert.match(rows[0]!.id, /^[0-9a-f]{64}$/);
});

test("the session token is stored hashed, never verbatim", async () => {
    const { app, db } = await withAccount();
    const login = await app.request("/login", postForm({ password }));
    const token = sessionCookie(login)!.replace("sid=", "");

    const rows = await db.select().from(sessions);
    assert.notEqual(rows[0]!.id, token);
});

test("/ requires a session", async () => {
    const { app } = await withAccount();

    const denied = await app.request("/");
    assert.equal(denied.status, 302);
    assert.equal(denied.headers.get("location"), "/login");

    const login = await app.request("/login", postForm({ password }));
    const cookie = sessionCookie(login)!;

    const allowed = await app.request("/", { headers: { cookie } });
    assert.equal(allowed.status, 200);
    assert.match(await allowed.text(), /admin/);
});

test("signing out drops the session", async () => {
    const { app, db } = await withAccount();
    const login = await app.request("/login", postForm({ password }));
    const cookie = sessionCookie(login)!;

    const out = await app.request("/logout", { method: "POST", headers: { cookie } });
    assert.equal(out.status, 303);
    assert.equal(out.headers.get("location"), "/login");
    assert.equal((await db.select().from(sessions)).length, 0);

    const after = await app.request("/", { headers: { cookie } });
    assert.equal(after.status, 302);
});

test("login without an account sends the visitor to setup", async () => {
    const { app } = testApp();
    const res = await app.request("/login", postForm({ password }));

    assert.equal(res.status, 303);
    assert.equal(res.headers.get("location"), "/setup");
});

test("repeated failures lock the client out, even with the right password", async () => {
    const { app } = await withAccount();

    for (let attempt = 0; attempt < 5; attempt += 1) {
        const res = await app.request("/login", postForm({ password: wrong }));
        assert.equal(res.status, 422);
    }

    const blocked = await app.request("/login", postForm({ password }));
    assert.equal(blocked.status, 429);
    assert.ok(Number(blocked.headers.get("retry-after")) > 0);
    assert.match(await blocked.text(), /Too many attempts/);
});

test("a successful login clears the failure count", async () => {
    const { app } = await withAccount();

    for (let attempt = 0; attempt < 4; attempt += 1) {
        await app.request("/login", postForm({ password: wrong }));
    }

    const ok = await app.request("/login", postForm({ password }));
    assert.equal(ok.status, 303);

    await app.request("/login", postForm({ password: wrong }));
    const again = await app.request("/login", postForm({ password }));
    assert.equal(again.status, 303);
});

test("failures from one address do not lock out another", async () => {
    process.env.TRUST_PROXY = "1";
    const { app } = await withAccount();
    const attempt = (ip: string, secret: string) =>
        app.request("/login", {
            ...postForm({ password: secret }),
            headers: { "content-type": "application/x-www-form-urlencoded", "x-forwarded-for": ip },
        });

    for (let attempt_count = 0; attempt_count < 5; attempt_count += 1) {
        assert.equal((await attempt("203.0.113.7", wrong)).status, 422);
    }

    assert.equal((await attempt("198.51.100.9", password)).status, 303);
    delete process.env.TRUST_PROXY;
});
