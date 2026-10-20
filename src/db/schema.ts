import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const now = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

export const users = sqliteTable("users", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    username: text("username").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    createdAt: text("created_at").notNull().default(now),
});

export const sessions = sqliteTable(
    "sessions",
    {
        id: text("id").primaryKey(),
        userId: integer("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        createdAt: text("created_at").notNull().default(now),
        expiresAt: text("expires_at").notNull(),
    },
    (table) => [
        index("sessions_user_idx").on(table.userId),
        index("sessions_expires_idx").on(table.expiresAt),
    ],
);

export const links = sqliteTable(
    "links",
    {
        id: integer("id").primaryKey({ autoIncrement: true }),
        slug: text("slug").notNull().unique(),
        targetUrl: text("target_url").notNull(),
        visibility: text("visibility").notNull().default("public"),
        createdAt: text("created_at").notNull().default(now),
        hits: integer("hits").notNull().default(0),
    },
    (table) => [
        check("links_visibility_check", sql`${table.visibility} in ('public', 'protected')`),
        check("links_slug_not_empty", sql`length(${table.slug}) > 0`),
        check("links_hits_not_negative", sql`${table.hits} >= 0`),
    ],
);
