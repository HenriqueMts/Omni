import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { categories, transactions } from "@/db/schema";
import { getInvoicesByUserId } from "./credit-card-invoices";

export type ReportPeriod = "monthly" | "yearly";

/** Dados para o gráfico Receita x Despesas por mês */
export type RevenueExpensePoint = {
  month: string;
  label: string;
  revenue: number;
  expense: number;
};

/** Dados para o gráfico de gastos por categoria (donut) */
export type SpendingByCategoryItem = {
  categoryId: string | null;
  categoryName: string;
  value: number;
  percent: number;
};

/** Resumo semanal (últimos 7 dias ou dias do mês) */
export type WeeklyActivity = {
  totalTransactions: number;
  totalSpent: number;
  dailyAvg: number;
  days: { day: string; label: string; count: number; amount: number }[];
};

export type CreditCardInvoiceSummary = {
  periodEnd: string;
  totalAmount: string;
};

export type ReportsData = {
  revenue: number;
  expense: number;
  balance: number;
  revenueExpensesChart: RevenueExpensePoint[];
  spendingByCategory: SpendingByCategoryItem[];
  weeklyActivity: WeeklyActivity;
  recentTransactions: {
    id: string;
    description: string | null;
    categoryName: string | null;
    date: string;
    amount: string;
    type: string;
  }[];
  creditCardInvoices: {
    totalAmount: number;
    count: number;
    invoices: CreditCardInvoiceSummary[];
  };
};

function getStartOfYear(): string {
  const d = new Date();
  d.setMonth(0, 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function getEndOfYear(): string {
  const d = new Date();
  d.setMonth(11, 31);
  d.setHours(23, 59, 59, 999);
  return d.toISOString().slice(0, 10);
}

export async function getReportsData(userId: string): Promise<ReportsData> {
  const startStr = getStartOfYear();
  const endStr = getEndOfYear();

  const list = await db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      type: transactions.type,
      description: transactions.description,
      date: transactions.date,
      categoryId: transactions.categoryId,
      categoryName: categories.name,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.date, startStr),
        lte(transactions.date, endStr)
      )
    )
    .orderBy(desc(transactions.date));

  const revenue = list
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + Number(t.amount), 0);
  const expense = list
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + Number(t.amount), 0);
  const balance = revenue - expense;

  const byMonth = new Map<
    string,
    { revenue: number; expense: number }
  >();
  for (let m = 1; m <= 12; m++) {
    const key = `${new Date().getFullYear()}-${String(m).padStart(2, "0")}`;
    byMonth.set(key, { revenue: 0, expense: 0 });
  }
  for (const t of list) {
    const monthKey = t.date.slice(0, 7);
    const curr = byMonth.get(monthKey) ?? { revenue: 0, expense: 0 };
    if (t.type === "income") curr.revenue += Number(t.amount);
    else if (t.type === "expense") curr.expense += Number(t.amount);
    byMonth.set(monthKey, curr);
  }
  const revenueExpensesChart: RevenueExpensePoint[] = Array.from(
    byMonth.entries()
  )
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, v]) => ({
      month,
      label: new Date(month + "-01").toLocaleDateString("pt-BR", {
        month: "short",
      }),
      revenue: v.revenue,
      expense: v.expense,
    }));

  const expenseList = list.filter((t) => t.type === "expense");
  const totalExpense = expenseList.reduce(
    (acc, t) => acc + Number(t.amount),
    0
  );
  const normalizeName = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replaceAll(/\p{Diacritic}/gu, "");
  const byCategory = new Map<string, { name: string; value: number }>();
  for (const t of expenseList) {
    const name = t.categoryName ?? "Sem categoria";
    const key = normalizeName(name);
    const curr = byCategory.get(key) ?? { name, value: 0 };
    curr.value += Number(t.amount);
    byCategory.set(key, curr);
  }
  const spendingByCategory: SpendingByCategoryItem[] = Array.from(
    byCategory.entries()
  ).map(([, { name, value }]) => ({
    categoryId: null,
    categoryName: name,
    value,
    percent: totalExpense > 0 ? (value / totalExpense) * 100 : 0,
  }));

  const now = new Date();
  const days: WeeklyActivity["days"] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayTransactions = list.filter((x) => x.date === dateStr);
    const amount = dayTransactions
      .filter((x) => x.type === "expense")
      .reduce((a, x) => a + Number(x.amount), 0);
    days.push({
      day: dateStr,
      label: d.toLocaleDateString("pt-BR", { day: "2-digit" }),
      count: dayTransactions.length,
      amount,
    });
  }
  const totalTransactions = days.reduce((a, d) => a + d.count, 0);
  const totalSpent = days.reduce((a, d) => a + d.amount, 0);
  const weeklyActivity: WeeklyActivity = {
    totalTransactions,
    totalSpent,
    dailyAvg: 7 > 0 ? Math.round(totalTransactions / 7) : 0,
    days,
  };

  const recentTransactions = list.slice(0, 5).map((t) => ({
    id: t.id,
    description: t.description,
    categoryName: t.categoryName,
    date: t.date,
    amount: t.amount,
    type: t.type,
  }));

  const invoices = await getInvoicesByUserId(userId, startStr, endStr);
  const creditCardInvoices = {
    totalAmount: invoices.reduce((acc, i) => acc + Number(i.totalAmount), 0),
    count: invoices.length,
    invoices: invoices.map((i) => ({
      periodEnd: i.periodEnd,
      totalAmount: i.totalAmount,
    })),
  };

  return {
    revenue,
    expense,
    balance,
    revenueExpensesChart,
    spendingByCategory,
    weeklyActivity,
    recentTransactions,
    creditCardInvoices,
  };
}
