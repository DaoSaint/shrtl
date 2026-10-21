import { test } from "node:test";
import assert from "node:assert/strict";
import { verify } from "@node-rs/argon2";
import { users } from "@/lib/db/schema.ts";
import { postForm, testApp } from "./helpers.ts";

const password = "correct horse battery";
const valid = { username: "admin", password, confirm: password };

test("GET /setup renders the form while no account exists", async () => {
    const { app } = testApp();
    const res = await app.request("/setup");
    assert.equal(res.status, 200);
    assert.match(await res.text(), /init --owner/);
});

test("POST /setup stores the admin account and redirects to /", async () => {
    const { app, db } = testApp();
    const res = await app.request("/setup", postForm(valid));

    assert.equal(res.status, 303);
    assert.equal(res.headers.get("location"), "/");

    const rows = await db.select().from(users);
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.username, "admin");
    assert.notEqual(rows[0]?.passwordHash, password);
    assert.equal(await verify(rows[0]!.passwordHash, password), true);
});

test("setup is closed once the account exists", async () => {
    const { app } = testApp();
    await app.request("/setup", postForm(valid));

    assert.equal((await app.request("/setup")).status, 404);
    assert.equal((await app.request("/setup", postForm(valid))).status, 404);
});

test("a rejected submission leaves no account behind", async () => {
    const { app, db } = testApp();
    const res = await app.request("/setup", postForm({ ...valid, username: "root" }));

    assert.equal(res.status, 422);
    assert.match(await res.text(), /Only the admin account/);
    assert.equal((await db.select().from(users)).length, 0);
});

test("mismatched confirmation is rejected", async () => {
    const { app, db } = testApp();
    const res = await app.request("/setup", postForm({ ...valid, confirm: "nope" }));

    assert.equal(res.status, 422);
    assert.match(await res.text(), /do not match/);
    assert.equal((await db.select().from(users)).length, 0);
});

test("short passwords are rejected", async () => {
    const { app, db } = testApp();
    const res = await app.request(
        "/setup",
        postForm({ username: "admin", password: "short", confirm: "short" }),
    );

    assert.equal(res.status, 422);
    const body = await res.text();
    assert.match(body, /12 to 200/);
    assert.match(body, /name="password"[^>]*border-red-400\/70/);
    assert.equal((await db.select().from(users)).length, 0);
});
