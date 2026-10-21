import { createHash, randomBytes } from "node:crypto";
import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { eq, lt } from "drizzle-orm";
import type { Db } from "@/lib/db/client.ts";
import { sessions, users } from "@/lib/db/schema.ts";

export const SESSION_COOKIE = "sid";

const TTL_MS = 30 * 24 * 60 * 60 * 1000;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export const startSession = async (db: Db, userId: number) => {
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + TTL_MS);

    await db.delete(sessions).where(lt(sessions.expiresAt, new Date().toISOString()));

    await db.insert(sessions).values({
        id: hashToken(token),
        userId,
        expiresAt: expiresAt.toISOString(),
    });

    return { token, expiresAt };
};

export const endSession = async (db: Db, token: string) => {
    await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
};

export const sessionUser = async (db: Db, token: string | undefined) => {
    if (!token) return undefined;

    const [row] = await db
        .select({ id: users.id, username: users.username, expiresAt: sessions.expiresAt })
        .from(sessions)
        .innerJoin(users, eq(users.id, sessions.userId))
        .where(eq(sessions.id, hashToken(token)));

    if (!row || new Date(row.expiresAt) <= new Date()) return undefined;
    return { id: row.id, username: row.username };
};

export const currentUser = (db: Db, c: Context) => sessionUser(db, getCookie(c, SESSION_COOKIE));

export const attachSession = (c: Context, token: string, expiresAt: Date) =>
    setCookie(c, SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: "Lax",
        path: "/",
        expires: expiresAt,
        secure: c.req.header("x-forwarded-proto") === "https",
    });

export const clearSession = (c: Context) => deleteCookie(c, SESSION_COOKIE, { path: "/" });
