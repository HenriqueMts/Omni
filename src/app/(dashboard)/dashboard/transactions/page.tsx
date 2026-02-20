import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAccountsByUserId } from "@/services/accounts";
import {
  getCategoriesByUserId,
  getTransactions,
} from "@/services/transactions";
import { TransactionsContent } from "@/components/transactions/transactions-content";

type SearchParams = {
  dateFrom?: string;
  dateTo?: string;
  type?: string;
  categoryId?: string;
  accountId?: string;
  search?: string;
};

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const dateFrom = params.dateFrom;
  const dateTo = params.dateTo;
  const type =
    params.type === "income" || params.type === "expense" || params.type === "transfer"
      ? params.type
      : undefined;
  const categoryId = params.categoryId;
  const accountId = params.accountId;
  const search = params.search;

  const [transactions, accounts, categories] = await Promise.all([
    getTransactions(user.id, {
      dateFrom,
      dateTo,
      type,
      categoryId: categoryId || undefined,
      accountId: accountId || undefined,
      search: search || undefined,
      limit: 500,
    }),
    getAccountsByUserId(user.id),
    getCategoriesByUserId(user.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in-up animate-opacity-0">
        <p className="text-sm text-zinc-500">Dashboard &gt; Transações</p>
      </div>
      <div className="animate-fade-in-up animate-opacity-0 animate-delay-1">
        <h2 className="text-2xl font-bold text-zinc-100">Transações</h2>
        <p className="text-zinc-500 mt-0.5">
          Controle entradas, saídas e gastos futuros em um só lugar
        </p>
      </div>
      <TransactionsContent
        transactions={transactions}
        accounts={accounts}
        categories={categories}
        filters={{ dateFrom, dateTo, type, categoryId, accountId, search }}
      />
    </div>
  );
}
