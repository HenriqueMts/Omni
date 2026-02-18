import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema";

export async function getProfileById(userId: string) {
  const [row] = await db
    .select({ fullName: profiles.fullName, avatarUrl: profiles.avatarUrl })
    .from(profiles)
    .where(eq(profiles.id, userId));
  return row ?? null;
}

/** Cria o perfil se não existir (ex.: primeiro acesso após signup). */
export async function ensureProfile(
  userId: string,
  email: string,
  fullName?: string | null,
) {
  const existing = await getProfileById(userId);
  if (existing) return;
  await db
    .insert(profiles)
    .values({ id: userId, email, fullName: fullName ?? null })
    .onConflictDoNothing({ target: profiles.id });
}
