import { test } from "node:test";
import assert from "node:assert/strict";
import { app } from "../src/app.ts";

test("GET /healthz returns ok", async () => {
    const res = await app.request("/healthz");
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { status: "ok" });
});

test("unknown paths are 404", async () => {
    const res = await app.request("/nope");
    assert.equal(res.status, 404);
});
