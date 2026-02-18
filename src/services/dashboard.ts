import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

export async function getDashboardStats() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { income: 0, expense: 0, total: 0, recentTransactions: [] };
  }

  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  );
  const startStr = startOfMonth.toISOString().slice(0, 10);

  const list = await db
    .select()
    .from(transactions)
    .where(
      and(eq(transactions.userId, user.id), gte(transactions.date, startStr)),
    )
    .orderBy(desc(transactions.date));

  const income = list
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + Number(t.amount), 0);
  const expense = list
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + Number(t.amount), 0);
  const total = income - expense;

  return {
    income,
    expense,
    total,
    recentTransactions: list.slice(0, 5),
  };
}
