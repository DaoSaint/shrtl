import { randomBytes } from "node:crypto";
import { and, desc, eq, like, ne, or, sql } from "drizzle-orm";
import type { Db } from "@/lib/db/client.ts";
import { links } from "@/lib/db/schema.ts";

export const SLUG_PATTERN = /^[a-z0-9][a-z0-9_-]{0,31}$/;
export const PAGE_SIZE = 20;

const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";
const AUTO_LENGTH = 6;
const AUTO_ATTEMPTS = 5;

export type Visibility = "public" | "private";

export type LinkDraft = {
    target: string;
    visibility: Visibility;
    slug: string;
};

export type LinkResult = { ok: true } | { ok: false; reason: string };

export const parseVisibility = (value: string | undefined): Visibility | undefined =>
    value === "public" || value === "private" ? value : undefined;

export const parseTarget = (raw: string) => {
    const value = raw.trim();
    const candidate = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;

    try {
        const url = new URL(candidate);
        if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
        return url.toString();
    } catch {
        return undefined;
    }
};

const randomSlug = () => {
    const bytes = randomBytes(AUTO_LENGTH);
    let slug = "";
    for (const byte of bytes) slug += ALPHABET.charAt(byte % ALPHABET.length);
    return slug;
};

const isDuplicate = (error: unknown) =>
    error instanceof Error && error.message.includes("UNIQUE constraint failed");

const slugTaken = async (db: Db, slug: string) =>
    (await db.query.links.findFirst({ columns: { id: true }, where: eq(links.slug, slug) })) !==
    undefined;

export type LinkQuery = { q?: string; visibility?: Visibility };

export const listLinks = async (
    db: Db,
    { q = "", visibility }: LinkQuery,
    { limit, offset }: { limit: number; offset: number },
) => {
    const filters = [];
    if (q) filters.push(or(like(links.slug, `%${q}%`), like(links.targetUrl, `%${q}%`)));
    if (visibility) filters.push(eq(links.visibility, visibility));

    const rows = await db
        .select()
        .from(links)
        .where(filters.length ? and(...filters) : undefined)
        .orderBy(desc(links.createdAt), desc(links.id))
        .limit(limit + 1)
        .offset(offset);

    return { items: rows.slice(0, limit), hasMore: rows.length > limit };
};

export const findLink = (db: Db, slug: string) =>
    db.query.links.findFirst({ where: eq(links.slug, slug) });

export const createLink = async (
    db: Db,
    { target, visibility, slug }: LinkDraft,
): Promise<LinkResult> => {
    if (slug) {
        if (await slugTaken(db, slug)) return { ok: false, reason: `${slug} is already taken.` };
        await db.insert(links).values({ slug, targetUrl: target, visibility });
        return { ok: true };
    }

    for (let attempt = 0; attempt < AUTO_ATTEMPTS; attempt += 1) {
        try {
            await db.insert(links).values({ slug: randomSlug(), targetUrl: target, visibility });
            return { ok: true };
        } catch (error) {
            if (!isDuplicate(error)) throw error;
        }
    }

    return { ok: false, reason: "Could not allocate a slug. Try again." };
};

export const updateLink = async (
    db: Db,
    id: number,
    { target, visibility, slug }: LinkDraft,
): Promise<LinkResult> => {
    const clash = await db.query.links.findFirst({
        columns: { id: true },
        where: and(eq(links.slug, slug), ne(links.id, id)),
    });

    if (clash) return { ok: false, reason: `${slug} is already taken.` };

    try {
        const updated = await db
            .update(links)
            .set({ targetUrl: target, visibility, slug })
            .where(eq(links.id, id))
            .returning({ id: links.id });

        if (updated.length === 0) return { ok: false, reason: "That link no longer exists." };
        return { ok: true };
    } catch (error) {
        if (isDuplicate(error)) return { ok: false, reason: `${slug} is already taken.` };
        throw error;
    }
};

export const removeLink = (db: Db, id: number) => db.delete(links).where(eq(links.id, id));

export const recordHit = (db: Db, id: number) =>
    db
        .update(links)
        .set({ hits: sql`${links.hits} + 1`, lastAccessAt: new Date().toISOString() })
        .where(eq(links.id, id))
        .run();
