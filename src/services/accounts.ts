import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import type { NewAccount } from "@/db/schema";

export async function getAccountsByUserId(userId: string) {
  return db.select().from(accounts).where(eq(accounts.userId, userId));
}

export async function createAccount(userId: string, data: Omit<NewAccount, "userId">) {
  const [row] = await db
    .insert(accounts)
    .values({ ...data, userId })
    .returning();
  return row;
}

export async function updateAccount(
  accountId: string,
  userId: string,
  data: Partial<Omit<NewAccount, "id" | "userId" | "createdAt">>,
) {
  const [row] = await db
    .update(accounts)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))
    .returning();
  return row ?? null;
}

export async function deleteAccount(accountId: string, userId: string) {
  const [row] = await db
    .delete(accounts)
    .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))
    .returning({ id: accounts.id });
  return !!row;
}
