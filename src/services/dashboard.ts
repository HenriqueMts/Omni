import { createClient } from "@/lib/supabase/server";

export async function getDashboardStats() {
  const supabase = await createClient();

  // Busca transações do mês atual
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .gte(
      "date",
      new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1,
      ).toISOString(),
    );

  if (!transactions)
    return { income: 0, expense: 0, total: 0, recentTransactions: [] };

  // Cálculos básicos
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const total = income - expense;

  return {
    income,
    expense,
    total,
    recentTransactions: transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5),
  };
}
