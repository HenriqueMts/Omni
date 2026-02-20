import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { creditCards } from "@/db/schema";

export async function getCreditCardsByUserId(userId: string) {
  return db
    .select()
    .from(creditCards)
    .where(eq(creditCards.userId, userId))
    .orderBy(desc(creditCards.createdAt));
}

export async function getCreditCardById(id: string, userId: string) {
  const [card] = await db
    .select()
    .from(creditCards)
    .where(and(eq(creditCards.id, id), eq(creditCards.userId, userId)));
  return card ?? null;
}

export async function createCreditCard(
  userId: string,
  data: {
    last4: string;
    holderName: string;
    expiryMonth: string;
    expiryYear: string;
    gradientKey: string;
  },
) {
  const [row] = await db
    .insert(creditCards)
    .values({
      userId,
      last4: data.last4.replaceAll(/\D/g, "").slice(-4),
      holderName: data.holderName.trim().slice(0, 100),
      expiryMonth: data.expiryMonth.replaceAll(/\D/g, "").slice(0, 2).padStart(2, "0"),
      expiryYear: data.expiryYear.replaceAll(/\D/g, "").slice(-2),
      gradientKey: data.gradientKey || "orange_red",
    })
    .returning();
  return row;
}

export async function deleteCreditCard(id: string, userId: string) {
  await db
    .delete(creditCards)
    .where(and(eq(creditCards.id, id), eq(creditCards.userId, userId)));
}
