import { and, desc, eq, gte, ilike, lte } from "drizzle-orm";
import { db } from "@/db";
import { accounts, categories, transactions } from "@/db/schema";

export type TransactionWithDetails = Awaited<
  ReturnType<typeof getTransactions>
>[number];

export type GetTransactionsFilters = {
  dateFrom?: string;
  dateTo?: string;
  type?: "income" | "expense" | "transfer";
  categoryId?: string;
  accountId?: string;
  search?: string;
  limit?: number;
  offset?: number;
};

/** Lista transações com categoria e conta; suporta filtros e paginação. */
export async function getTransactions(
  userId: string,
  filters: GetTransactionsFilters = {},
) {
  const {
    dateFrom,
    dateTo,
    type,
    categoryId,
    accountId,
    search,
    limit = 100,
    offset = 0,
  } = filters;

  const conditions = [eq(transactions.userId, userId)];

  if (dateFrom) conditions.push(gte(transactions.date, dateFrom));
  if (dateTo) conditions.push(lte(transactions.date, dateTo));
  if (type) conditions.push(eq(transactions.type, type));
  if (categoryId) conditions.push(eq(transactions.categoryId, categoryId));
  if (accountId) conditions.push(eq(transactions.accountId, accountId));
  if (search?.trim()) {
    conditions.push(
      ilike(transactions.description, "%" + search.trim() + "%"),
    );
  }

  const rows = await db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      type: transactions.type,
      description: transactions.description,
      date: transactions.date,
      isRecurring: transactions.isRecurring,
      aiGenerated: transactions.aiGenerated,
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      accountId: transactions.accountId,
      accountName: accounts.name,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .leftJoin(accounts, eq(transactions.accountId, accounts.id))
    .where(and(...conditions))
    .orderBy(desc(transactions.date), desc(transactions.createdAt))
    .limit(limit)
    .offset(offset);

  return rows;
}

/** Categorias do usuário para filtros e formulários. */
export async function getCategoriesByUserId(userId: string) {
  return db
    .select()
    .from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(categories.name);
}

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

/** Busca categoria por nome e tipo (normalizado); se não existir, cria. Retorna a categoria. */
export async function getOrCreateCategory(
  userId: string,
  name: string,
  type: "income" | "expense",
) {
  const normalizedName = name.trim().slice(0, 200) || "Outros";
  const existing = await db
    .select()
    .from(categories)
    .where(
      and(
        eq(categories.userId, userId),
        eq(categories.name, normalizedName),
        eq(categories.type, type),
      ),
    )
    .limit(1);
  if (existing[0]) return existing[0];
  const [created] = await db
    .insert(categories)
    .values({
      userId,
      name: normalizedName,
      type,
    })
    .returning();
  if (!created) throw new Error("Falha ao criar categoria");
  return created;
}

/** Insere transações extraídas pela IA na conta indicada; cria categorias se necessário.
 * Se closingBalance for informado, atualiza o saldo da conta para esse valor (saldo ao final do período do extrato). */
export async function insertExtractedTransactions(
  userId: string,
  accountId: string,
  items: ExtractedTransactionInput[],
  closingBalance: number | null = null,
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

  if (closingBalance !== null && !Number.isNaN(closingBalance)) {
    await db
      .update(accounts)
      .set({
        balance: closingBalance.toFixed(2),
        updatedAt: new Date(),
      })
      .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)));
  }

  return { inserted: values.length };
}

export type CreateTransactionInput = {
  accountId: string;
  categoryId: string | null;
  amount: number;
  type: "income" | "expense" | "transfer";
  description: string | null;
  date: string;
  isRecurring?: boolean;
};

/** Cria uma transação manual (incluindo gastos futuros). */
export async function createTransaction(
  userId: string,
  data: CreateTransactionInput,
) {
  const [row] = await db
    .insert(transactions)
    .values({
      userId,
      accountId: data.accountId,
      categoryId: data.categoryId,
      amount: Number(data.amount).toFixed(2),
      type: data.type,
      description: (data.description ?? "").slice(0, 500) || null,
      date: data.date,
      isRecurring: data.isRecurring ?? false,
      aiGenerated: false,
    })
    .returning();
  return row ?? null;
}
