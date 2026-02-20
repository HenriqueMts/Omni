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
      accountId: transactions.accountId,
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

  // Identificar e excluir transferências entre contas do mesmo usuário
  const transferCategoryNames = new Set(["transferencia", "transferência", "transfer"]);
  const normalizeCat = (s: string | null) => s?.trim().toLowerCase().normalize("NFD").replaceAll(/\p{Diacritic}/gu, "") ?? "";
  
  const transferTransactions = rows.filter((t) => {
    const catNorm = normalizeCat(t.categoryName);
    const descLower = (t.description ?? "").toLowerCase();
    const isTransferDesc = descLower.includes("pix") || descLower.includes("ted") || descLower.includes("doc") || descLower.includes("transferência") || descLower.includes("transferencia");
    return transferCategoryNames.has(catNorm) || t.type === "transfer" || isTransferDesc;
  });

  const transferMap = new Map<string, typeof rows>();
  for (const t of transferTransactions) {
    const amount = Math.abs(Number(t.amount));
    const dateKey = t.date;
    const key = `${amount.toFixed(2)}|${dateKey}`;
    if (!transferMap.has(key)) transferMap.set(key, []);
    transferMap.get(key)!.push(t);
  }

  const transferIdsToExclude = new Set<string>();
  for (const [, trans] of transferMap.entries()) {
    if (trans.length < 2) continue;
    const expenses = trans.filter((t) => t.type === "expense");
    const incomes = trans.filter((t) => t.type === "income");
    
    if (expenses.length > 0 && incomes.length > 0) {
      for (const exp of expenses) {
        const expAmount = Math.abs(Number(exp.amount));
        for (const inc of incomes) {
          const incAmount = Math.abs(Number(inc.amount));
          if (Math.abs(expAmount - incAmount) < 0.01) {
            transferIdsToExclude.add(exp.id);
            transferIdsToExclude.add(inc.id);
          }
        }
      }
    }
  }

  const filteredRows = rows.filter((t) => !transferIdsToExclude.has(t.id));

  const { income, expense, investment, total } = aggregateTotals(filteredRows);

  const list = filteredRows.map((t) => ({
    id: t.id,
    amount: t.amount,
    type: t.type,
    description: t.description,
    date: t.date,
  }));

  const chartData = buildChartData(filteredRows);

  return {
    income,
    expense,
    investment,
    total,
    recentTransactions: list.slice(0, 5),
    chartData,
  };
}
