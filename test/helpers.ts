import { createApp } from "@/app.tsx";
import { createDb } from "@/lib/db/client.ts";
import { runMigrations } from "@/lib/db/migrate.ts";

export const PASSWORD = "correct horse battery";

export const testApp = () => {
    const db = createDb(":memory:");
    runMigrations(db);
    return { db, app: createApp(db) };
};

export const postForm = (fields: Record<string, string>, cookie?: string) => ({
    method: "POST",
    headers: {
        "content-type": "application/x-www-form-urlencoded",
        ...(cookie ? { cookie } : {}),
    },
    body: new URLSearchParams(fields).toString(),
});

export const sessionCookie = (res: Response) => {
    const cookie = res.headers.get("set-cookie");
    return cookie ? cookie.split(";")[0] : undefined;
};

export const withAccount = async () => {
    const { db, app } = testApp();
    await app.request(
        "/setup",
        postForm({ username: "admin", password: PASSWORD, confirm: PASSWORD }),
    );
    return { db, app };
};

export const signedIn = async () => {
    const context = await withAccount();
    const res = await context.app.request("/login", postForm({ password: PASSWORD }));
    return { ...context, cookie: sessionCookie(res)! };
};
