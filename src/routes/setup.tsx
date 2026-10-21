import { Hono } from "hono";
import { z } from "zod";
import { createOwner, OWNER_USERNAME, ownerExists } from "@/lib/account.ts";
import type { Db } from "@/lib/db/client.ts";
import { document } from "@/views/layout.tsx";
import { SetupPage } from "@/views/setup.tsx";

const setupInput = z
    .object({
        username: z.literal(OWNER_USERNAME),
        password: z.string().min(12).max(200),
        confirm: z.string(),
    })
    .refine((input) => input.password === input.confirm, { path: ["confirm"] });

const fieldOf = (error: z.ZodError) => error.issues[0]?.path[0] as string | undefined;

const reason = (error: z.ZodError) => {
    const field = error.issues[0]?.path[0];
    if (field === "username") return "Only the admin account can be created.";
    if (field === "password") return "Password must be 12 to 200 characters.";
    return "Passwords do not match.";
};

export const setupRoutes = (db: Db) => {
    const routes = new Hono();

    routes.get("/", async (c) =>
        (await ownerExists(db)) ? c.notFound() : c.html(await document(<SetupPage />)),
    );

    routes.post("/", async (c) => {
        if (await ownerExists(db)) return c.notFound();

        const input = setupInput.safeParse(await c.req.parseBody());
        if (!input.success) {
            return c.html(
                await document(
                    <SetupPage error={reason(input.error)} errorField={fieldOf(input.error)} />,
                ),
                422,
            );
        }

        try {
            await createOwner(db, input.data.password);
        } catch {
            return c.notFound();
        }

        return c.redirect("/", 303);
    });

    return routes;
};
