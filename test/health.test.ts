import { test } from "node:test";
import assert from "node:assert/strict";
import { testApp, withAccount } from "./helpers.ts";

test("GET /healthz returns ok", async () => {
    const { app } = testApp();
    const res = await app.request("/healthz");
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { status: "ok" });
});

test("unknown paths are 404", async () => {
    const { app } = testApp();
    const res = await app.request("/nope");
    assert.equal(res.status, 404);
});

test("GET / sends a fresh instance to setup", async () => {
    const { app } = testApp();
    const res = await app.request("/");

    assert.equal(res.status, 302);
    assert.equal(res.headers.get("location"), "/setup");
});

test("GET / sends a signed-out instance to login", async () => {
    const { app } = await withAccount();
    const res = await app.request("/");

    assert.equal(res.status, 302);
    assert.equal(res.headers.get("location"), "/login");
});

test("unknown paths render the terminal 404 page", async () => {
    const { app } = testApp();
    const res = await app.request("/nothing/here");

    assert.equal(res.status, 404);
    const body = await res.text();
    assert.match(body, /no such file or directory/);
    assert.match(body, /\/nothing\/here/);
});
