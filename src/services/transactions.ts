import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, transactions } from "@/db/schema";

export type ExtractedTransactionInput = {
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
};

/** Busca categoria por nome e tipo; se não existir, cria e retorna o id. */
export async function getOrCreateCategoryId(
  userId: string,
  name: string,
  type: "income" | "expense",
): Promise<string> {
  const normalizedName = name.trim().slice(0, 200) || "Outros";
  const existing = await db
    .select({ id: categories.id })
    .from(categories)
    .where(
      and(
        eq(categories.userId, userId),
        eq(categories.name, normalizedName),
        eq(categories.type, type),
      ),
    )
    .limit(1);
  if (existing[0]) return existing[0].id;
  const [created] = await db
    .insert(categories)
    .values({
      userId,
      name: normalizedName,
      type,
    })
    .returning({ id: categories.id });
  if (!created) throw new Error("Falha ao criar categoria");
  return created.id;
}

/** Insere transações extraídas pela IA na conta indicada; cria categorias se necessário. */
export async function insertExtractedTransactions(
  userId: string,
  accountId: string,
  items: ExtractedTransactionInput[],
): Promise<{ inserted: number; error?: string }> {
  if (items.length === 0) return { inserted: 0 };
  const values = await Promise.all(
    items.map(async (t) => {
      const categoryId = await getOrCreateCategoryId(userId, t.category, t.type);
      return {
        userId,
        accountId,
        categoryId,
        amount: Number(t.amount).toFixed(2),
        type: t.type,
        description: (t.description ?? "").slice(0, 500),
        date: t.date,
        aiGenerated: true,
      };
    }),
  );
  await db.insert(transactions).values(values);
  return { inserted: values.length };
}
