import { Hono } from "hono";
import type { Context } from "hono";
import { z } from "zod";
import type { Db } from "@/lib/db/client.ts";
import {
    createLink,
    listLinks,
    PAGE_SIZE,
    parseTarget,
    parseVisibility,
    removeLink,
    SLUG_PATTERN,
    updateLink,
} from "@/lib/links.ts";
import { currentUser } from "@/lib/session.ts";
import { document } from "@/views/layout.tsx";
import { DashboardPage, type DashboardProps, type LinkDraft } from "@/views/dashboard.tsx";

const draft = z.object({
    target: z
        .string()
        .max(2048)
        .transform((value, ctx) => {
            const target = parseTarget(value);
            if (!target) {
                ctx.addIssue({ code: "custom", message: "target" });
                return z.NEVER;
            }
            return target;
        }),
    visibility: z.enum(["public", "private"]),
    slug: z
        .string()
        .trim()
        .toLowerCase()
        .refine((value) => value === "" || SLUG_PATTERN.test(value), { message: "slug" }),
});

const idInput = z.coerce.number().int().positive();

const field = (body: Record<string, unknown>, key: string) =>
    typeof body[key] === "string" ? (body[key] as string) : "";

const draftFrom = (body: Record<string, unknown>): LinkDraft => ({
    target: field(body, "target"),
    slug: field(body, "slug"),
    visibility: field(body, "visibility") === "private" ? "private" : "public",
});

const fieldOf = (error: z.ZodError) => error.issues[0]?.path[0] as string | undefined;

const reason = (error: z.ZodError) => {
    const field = error.issues[0]?.path[0];
    if (field === "target") return "Enter a valid http or https URL.";
    if (field === "slug") return "Slug must be 1-32 characters: a-z, 0-9, - or _.";
    if (field === "visibility") return "Pick public or private.";
    return "That redirection could not be read.";
};

export const linkRoutes = (db: Db) => {
    const routes = new Hono();

    const refuse = async (
        c: Context,
        error: string,
        extra: Pick<DashboardProps, "draft" | "editDraft" | "errorForm" | "errorField"> = {},
    ) => {
        const user = await currentUser(db, c);
        return c.html(
            await document(
                <DashboardPage
                    username={user?.username ?? ""}
                    links={(await listLinks(db, {}, { limit: PAGE_SIZE, offset: 0 })).items}
                    query=""
                    state="all"
                    next={null}
                    error={error}
                    {...extra}
                />,
            ),
            422,
        );
    };

    routes.use("*", async (c, next) => {
        if (!(await currentUser(db, c))) return c.redirect("/login");
        await next();
    });

    routes.get("/page", async (c) => {
        const q = c.req.query("q") ?? "";
        const visibility = parseVisibility(c.req.query("state"));
        const offset = Math.max(0, Number(c.req.query("offset") ?? "0") || 0);

        const { items, hasMore } = await listLinks(
            db,
            { q, visibility },
            { limit: PAGE_SIZE, offset },
        );

        return c.json({ items, next: hasMore ? offset + items.length : null });
    });

    routes.post("/", async (c) => {
        const body = await c.req.parseBody();
        const submitted = draftFrom(body);
        const input = draft.safeParse(body);
        if (!input.success)
            return refuse(c, reason(input.error), {
                errorForm: "create",
                errorField: fieldOf(input.error),
                draft: submitted,
            });

        const result = await createLink(db, input.data);
        if (!result.ok)
            return refuse(c, result.reason, {
                errorForm: "create",
                errorField: "slug",
                draft: submitted,
            });

        return c.redirect("/", 303);
    });

    routes.post("/update", async (c) => {
        const body = await c.req.parseBody();
        const input = draft.safeParse(body);
        const id = idInput.safeParse(body.id);
        const submitted = draftFrom(body);

        if (!id.success) return refuse(c, "That redirection no longer exists.");

        const editDraft = { ...submitted, id: id.data };
        if (!input.success)
            return refuse(c, reason(input.error), {
                errorForm: "update",
                errorField: fieldOf(input.error),
                editDraft,
            });

        const result = await updateLink(db, id.data, input.data);
        if (!result.ok)
            return refuse(c, result.reason, {
                errorForm: "update",
                errorField: "slug",
                editDraft,
            });

        return c.redirect("/", 303);
    });

    routes.post("/delete", async (c) => {
        const id = idInput.safeParse((await c.req.parseBody()).id);
        if (id.success) await removeLink(db, id.data);

        return c.redirect("/", 303);
    });

    return routes;
};
