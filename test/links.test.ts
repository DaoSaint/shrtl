import { test } from "node:test";
import assert from "node:assert/strict";
import { links } from "@/lib/db/schema.ts";
import { postForm, signedIn } from "./helpers.ts";

const add = (
    app: Awaited<ReturnType<typeof signedIn>>["app"],
    cookie: string,
    fields: Record<string, string>,
) => app.request("/links", postForm({ visibility: "public", slug: "", ...fields }, cookie));

const rows = (db: Awaited<ReturnType<typeof signedIn>>["db"]) => db.select().from(links);

test("creating a redirection requires a session", async () => {
    const { app } = await signedIn();
    const res = await app.request("/links", postForm({ target: "example.com" }));

    assert.equal(res.status, 302);
    assert.equal(res.headers.get("location"), "/login");
});

test("a custom public slug is stored as given", async () => {
    const { app, db, cookie } = await signedIn();
    const res = await add(app, cookie, { target: "https://example.com/a", slug: "launch" });

    assert.equal(res.status, 303);

    const [row] = await rows(db);
    assert.equal(row?.slug, "launch");
    assert.equal(row?.targetUrl, "https://example.com/a");
    assert.equal(row?.visibility, "public");
    assert.equal(row?.hits, 0);
    assert.equal(row?.lastAccessAt, null);
});

test("an empty slug is generated", async () => {
    const { app, db, cookie } = await signedIn();
    await add(app, cookie, { target: "https://example.com/b" });

    const [row] = await rows(db);
    assert.match(row!.slug, /^[0-9a-z]{6}$/);
});

test("private redirections keep their visibility", async () => {
    const { app, db, cookie } = await signedIn();
    await add(app, cookie, {
        target: "https://example.com/c",
        slug: "secret",
        visibility: "private",
    });

    const [row] = await rows(db);
    assert.equal(row?.visibility, "private");
});

test("query strings and fragments survive", async () => {
    const { app, db, cookie } = await signedIn();
    await add(app, cookie, { target: "https://example.com/p?utm=1#top", slug: "deep" });

    const [row] = await rows(db);
    assert.equal(row?.targetUrl, "https://example.com/p?utm=1#top");
});

test("non-http targets are rejected", async () => {
    const { app, db, cookie } = await signedIn();
    const res = await add(app, cookie, { target: "javascript:alert(1)" });

    assert.equal(res.status, 422);
    assert.match(await res.text(), /valid http or https/);
    assert.equal((await rows(db)).length, 0);
});

test("invalid slugs are rejected", async () => {
    const { app, db, cookie } = await signedIn();
    const res = await add(app, cookie, { target: "https://example.com", slug: "Not Valid!" });

    assert.equal(res.status, 422);
    assert.match(await res.text(), /Slug must be/);
    assert.equal((await rows(db)).length, 0);
});

test("a taken slug is rejected", async () => {
    const { app, cookie } = await signedIn();
    await add(app, cookie, { target: "https://example.com/1", slug: "taken" });

    const res = await add(app, cookie, { target: "https://example.com/2", slug: "taken" });
    assert.equal(res.status, 422);
    assert.match(await res.text(), /already taken/);
});

test("updating changes target, slug and visibility", async () => {
    const { app, db, cookie } = await signedIn();
    await add(app, cookie, { target: "https://example.com/old", slug: "old" });

    const [row] = await rows(db);
    const res = await app.request(
        "/links/update",
        postForm(
            {
                id: String(row!.id),
                target: "https://example.com/new",
                slug: "new",
                visibility: "private",
            },
            cookie,
        ),
    );

    assert.equal(res.status, 303);

    const [updated] = await rows(db);
    assert.equal(updated?.slug, "new");
    assert.equal(updated?.targetUrl, "https://example.com/new");
    assert.equal(updated?.visibility, "private");
});

test("updating onto another slug is rejected", async () => {
    const { app, db, cookie } = await signedIn();
    await add(app, cookie, { target: "https://example.com/1", slug: "one" });
    await add(app, cookie, { target: "https://example.com/2", slug: "two" });

    const [first] = await rows(db);
    const res = await app.request(
        "/links/update",
        postForm(
            {
                id: String(first!.id),
                target: "https://example.com/1",
                slug: "two",
                visibility: "public",
            },
            cookie,
        ),
    );

    assert.equal(res.status, 422);
    assert.match(await res.text(), /already taken/);
});

test("deleting removes the redirection", async () => {
    const { app, db, cookie } = await signedIn();
    await add(app, cookie, { target: "https://example.com/gone", slug: "gone" });

    const [row] = await rows(db);
    const res = await app.request("/links/delete", postForm({ id: String(row!.id) }, cookie));

    assert.equal(res.status, 303);
    assert.equal((await rows(db)).length, 0);
});

test("a public redirection redirects and counts the hit", async () => {
    const { app, db, cookie } = await signedIn();
    await add(app, cookie, { target: "https://example.com/target", slug: "go" });

    const res = await app.request("/p/go");
    assert.equal(res.status, 302);
    assert.equal(res.headers.get("location"), "https://example.com/target");

    await Bun.sleep(20);
    const [row] = await rows(db);
    assert.equal(row?.hits, 1);
    assert.ok(row?.lastAccessAt);
});

test("a private redirection is invisible without a session", async () => {
    const { app, cookie } = await signedIn();
    await add(app, cookie, {
        target: "https://example.com/private",
        slug: "vault",
        visibility: "private",
    });

    assert.equal((await app.request("/r/vault")).status, 404);
    assert.equal((await app.request("/p/vault")).status, 404);
});

test("a private redirection redirects the owner", async () => {
    const { app, cookie } = await signedIn();
    await add(app, cookie, {
        target: "https://example.com/private",
        slug: "vault",
        visibility: "private",
    });

    const res = await app.request("/r/vault", { headers: { cookie } });
    assert.equal(res.status, 302);
    assert.equal(res.headers.get("location"), "https://example.com/private");
});

test("an unknown slug renders the 404 page", async () => {
    const { app } = await signedIn();
    const res = await app.request("/p/missing");

    assert.equal(res.status, 404);
    assert.match(await res.text(), /no such file or directory/);
});

const seed = async (
    app: Awaited<ReturnType<typeof signedIn>>["app"],
    cookie: string,
    count: number,
) => {
    for (let index = 0; index < count; index += 1) {
        await add(app, cookie, {
            target: `https://example.com/${index}`,
            slug: `seed-${index}`,
            visibility: index % 2 === 0 ? "public" : "private",
        });
    }
};

test("the page endpoint requires a session", async () => {
    const { app } = await signedIn();
    const res = await app.request("/links/page");

    assert.equal(res.status, 302);
    assert.equal(res.headers.get("location"), "/login");
});

test("pages are served with a next offset until exhausted", async () => {
    const { app, cookie } = await signedIn();
    await seed(app, cookie, 25);

    const first = await app.request("/links/page?offset=0", { headers: { cookie } });
    const firstPage = (await first.json()) as { items: unknown[]; next: number | null };
    assert.equal(firstPage.items.length, 20);
    assert.equal(firstPage.next, 20);

    const second = await app.request("/links/page?offset=20", { headers: { cookie } });
    const secondPage = (await second.json()) as { items: unknown[]; next: number | null };
    assert.equal(secondPage.items.length, 5);
    assert.equal(secondPage.next, null);
});

test("the state filter narrows the list", async () => {
    const { app, cookie } = await signedIn();
    await seed(app, cookie, 6);

    const res = await app.request("/links/page?state=private", { headers: { cookie } });
    const page = (await res.json()) as { items: { visibility: string }[] };

    assert.equal(page.items.length, 3);
    assert.equal(
        page.items.every((item) => item.visibility === "private"),
        true,
    );
});

test("the search matches slug and target", async () => {
    const { app, cookie } = await signedIn();
    await add(app, cookie, { target: "https://example.com/docs", slug: "handbook" });
    await add(app, cookie, { target: "https://example.com/other", slug: "misc" });

    const bySlug = (await (
        await app.request("/links/page?q=hand", { headers: { cookie } })
    ).json()) as { items: { slug: string }[] };
    assert.deepEqual(
        bySlug.items.map((item) => item.slug),
        ["handbook"],
    );

    const byTarget = (await (
        await app.request("/links/page?q=other", { headers: { cookie } })
    ).json()) as { items: { slug: string }[] };
    assert.deepEqual(
        byTarget.items.map((item) => item.slug),
        ["misc"],
    );
});

test("the dashboard ships server-rendered rows and hydration props", async () => {
    const { app, cookie } = await signedIn();
    await add(app, cookie, { target: "https://example.com/x", slug: "copy-me" });

    const res = await app.request("/", { headers: { cookie } });
    const body = await res.text();

    assert.match(body, /id="dashboard-root"/);
    assert.match(body, /id="dashboard-props"/);
    assert.match(body, /src="\/dashboard.js"/);
    assert.match(body, /id="link-list"/);
    assert.match(body, /<span class="text-signal\/60">\/p\/<\/span>copy-me/);
    assert.equal(body.includes("onclick="), false);
});

test("a rejected create keeps the submitted values in the form", async () => {
    const { app, cookie } = await signedIn();
    await add(app, cookie, { target: "https://example.com/first", slug: "taken" });

    const res = await add(app, cookie, { target: "https://example.com/second", slug: "taken" });
    const body = await res.text();

    assert.equal(res.status, 422);
    assert.match(body, /value="https:\/\/example\.com\/second"/);
    assert.match(body, /value="taken"/);
});

test("a rejected update keeps the edit form open with the submitted values", async () => {
    const { app, db, cookie } = await signedIn();
    await add(app, cookie, { target: "https://example.com/one", slug: "one" });
    await add(app, cookie, { target: "https://example.com/two", slug: "two" });

    const [first] = await rows(db);
    const res = await app.request(
        "/links/update",
        postForm(
            {
                id: String(first!.id),
                target: "https://example.com/edited",
                slug: "two",
                visibility: "private",
            },
            cookie,
        ),
    );
    const body = await res.text();

    assert.equal(res.status, 422);
    assert.match(body, /Edit redirection/);
    assert.match(body, /value="https:\/\/example\.com\/edited"/);
    assert.match(body, /value="two"/);
});

test("the failing field is outlined", async () => {
    const { app, db, cookie } = await signedIn();
    await add(app, cookie, { target: "https://example.com/one", slug: "one" });
    await add(app, cookie, { target: "https://example.com/two", slug: "two" });

    const create = await add(app, cookie, { target: "https://example.com/x", slug: "one" });
    assert.match(await create.text(), /name="slug"[^>]*border-red-400\/70/);

    const [first] = await rows(db);
    const update = await app.request(
        "/links/update",
        postForm(
            {
                id: String(first!.id),
                target: "https://example.com/y",
                slug: "two",
                visibility: "public",
            },
            cookie,
        ),
    );
    const body = await update.text();

    assert.match(body, /Edit redirection/);
    assert.match(body, /name="slug"[^>]*border-red-400\/70/);
    assert.match(body, /already taken/);
});

test("an invalid target flags the target field", async () => {
    const { app, cookie } = await signedIn();
    const res = await add(app, cookie, { target: "javascript:alert(1)", slug: "nope" });
    const body = await res.text();

    assert.equal(res.status, 422);
    assert.match(body, /name="target"[^>]*border-red-400\/70/);
    assert.equal(body.includes('name="slug" value="nope"'), true);
});
