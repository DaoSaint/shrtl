import type { Context } from "hono";
import type { Db } from "@/lib/db/client.ts";
import { findLink, recordHit, type Visibility } from "@/lib/links.ts";
import { currentUser } from "@/lib/session.ts";

export const redirectHandler = (db: Db, visibility: Visibility) => async (c: Context) => {
    if (visibility === "private" && !(await currentUser(db, c))) return c.notFound();

    const link = await findLink(db, c.req.param("slug") ?? "");
    if (!link || link.visibility !== visibility) return c.notFound();

    recordHit(db, link.id);

    return c.redirect(link.targetUrl, 302);
};
