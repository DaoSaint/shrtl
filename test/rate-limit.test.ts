import { test } from "node:test";
import assert from "node:assert/strict";
import { createRateLimit } from "@/lib/rate-limit.ts";

const clock = (start = 0) => {
    let at = start;
    return { now: () => at, advance: (ms: number) => (at += ms) };
};

test("allows attempts until the limit is reached", () => {
    const time = clock();
    const limit = createRateLimit({ limit: 3, windowMs: 1000, now: time.now });

    assert.equal(limit.wait("ip"), 0);
    limit.fail("ip");
    limit.fail("ip");
    assert.equal(limit.wait("ip"), 0);

    limit.fail("ip");
    assert.equal(limit.wait("ip"), 1);
});

test("reports the seconds left in the window", () => {
    const time = clock();
    const limit = createRateLimit({ limit: 1, windowMs: 10_000, now: time.now });

    limit.fail("ip");
    time.advance(4000);
    assert.equal(limit.wait("ip"), 6);
});

test("the window expires", () => {
    const time = clock();
    const limit = createRateLimit({ limit: 1, windowMs: 1000, now: time.now });

    limit.fail("ip");
    assert.equal(limit.wait("ip"), 1);

    time.advance(1000);
    assert.equal(limit.wait("ip"), 0);
});

test("clearing releases the key", () => {
    const time = clock();
    const limit = createRateLimit({ limit: 1, windowMs: 1000, now: time.now });

    limit.fail("ip");
    limit.clear("ip");
    assert.equal(limit.wait("ip"), 0);
});

test("keys are tracked independently", () => {
    const time = clock();
    const limit = createRateLimit({ limit: 1, windowMs: 1000, now: time.now });

    limit.fail("a");
    assert.equal(limit.wait("b"), 0);
});
