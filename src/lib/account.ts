import { hash, verify } from "@node-rs/argon2";
import type { Db } from "@/lib/db/client.ts";
import { users } from "@/lib/db/schema.ts";

export const OWNER_USERNAME = "admin";

export const owner = async (db: Db) => db.query.users.findFirst();

export const ownerExists = async (db: Db) => (await owner(db)) !== undefined;

export const createOwner = async (db: Db, password: string) => {
    const passwordHash = await hash(password);
    await db.insert(users).values({ username: OWNER_USERNAME, passwordHash });
};

export const passwordMatches = async (passwordHash: string, password: string) =>
    verify(passwordHash, password).catch(() => false);
