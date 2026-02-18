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
    return { income: 0, expense: 0, total: 0, recentTransactions: [], chartData: [] };
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

  // Agrupa por data para o gráfico de fluxo de caixa
  const byDate = new Map<string, { income: number; expense: number }>();
  for (const t of list) {
    const key = t.date;
    const curr = byDate.get(key) ?? { income: 0, expense: 0 };
    if (t.type === "income") curr.income += Number(t.amount);
    else if (t.type === "expense") curr.expense += Number(t.amount);
    byDate.set(key, curr);
  }
  const chartData = Array.from(byDate.entries())
    .map(([date, v]) => ({
      date,
      label: new Date(date + "T12:00:00").toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      }),
      income: v.income,
      expense: v.expense,
      saldo: v.income - v.expense,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    income,
    expense,
    total,
    recentTransactions: list.slice(0, 5),
    chartData,
  };
}
