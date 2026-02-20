import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { transactions, categories } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { normalizeCategoryName } from "@/lib/categories";

const INVESTIMENTO_KEY = normalizeCategoryName("Investimento");

type Row = { amount: string; type: string; date: string; categoryName: string | null };

function isInvestmentCategory(categoryName: string | null): boolean {
  return categoryName != null && normalizeCategoryName(categoryName) === INVESTIMENTO_KEY;
}

function aggregateTotals(rows: Row[]) {
  let income = 0;
  let expense = 0;
  let investment = 0;
  for (const t of rows) {
    const amount = Number(t.amount);
    if (t.type === "income") income += amount;
    else if (t.type === "expense") {
      if (isInvestmentCategory(t.categoryName)) investment += amount;
      else expense += amount;
    }
  }
  return { income, expense, investment, total: income - expense };
}

function buildChartData(rows: Row[]) {
  const byDate = new Map<string, { income: number; expense: number }>();
  for (const t of rows) {
    const key = t.date;
    const curr = byDate.get(key) ?? { income: 0, expense: 0 };
    if (t.type === "income") curr.income += Number(t.amount);
    else if (t.type === "expense" && !isInvestmentCategory(t.categoryName)) {
      curr.expense += Number(t.amount);
    }
    byDate.set(key, curr);
  }
  return Array.from(byDate.entries())
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
}

export async function getDashboardStats() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { income: 0, expense: 0, investment: 0, total: 0, recentTransactions: [], chartData: [] };
  }

  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  );
  const startStr = startOfMonth.toISOString().slice(0, 10);

  const rows = await db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      type: transactions.type,
      description: transactions.description,
      date: transactions.date,
      categoryName: categories.name,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(eq(transactions.userId, user.id), gte(transactions.date, startStr)),
    )
    .orderBy(desc(transactions.date));

  const { income, expense, investment, total } = aggregateTotals(rows);

  const list = rows.map((t) => ({
    id: t.id,
    amount: t.amount,
    type: t.type,
    description: t.description,
    date: t.date,
  }));

  const chartData = buildChartData(rows);

  return {
    income,
    expense,
    investment,
    total,
    recentTransactions: list.slice(0, 5),
    chartData,
  };
}
