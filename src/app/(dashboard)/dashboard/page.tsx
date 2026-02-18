import { getDashboardStats } from "@/services/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  DollarSign,
  Activity,
  TrendingUp,
} from "lucide-react";
import { GreetingCard } from "@/components/dashboard/greeting-card";
import { CashFlowChart } from "@/components/dashboard/cash-flow-chart";
import { AISuggestionsCard } from "@/components/dashboard/ai-suggestions-card";
import { ImportExtractsButton } from "@/components/dashboard/import-extracts-button";

export default async function DashboardPage() {
  const { income, expense, total, recentTransactions, chartData } =
    await getDashboardStats();

  const savings = income - expense;
  const savingsPercent =
    income > 0 ? Math.round((savings / income) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Importar extratos */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in-up animate-opacity-0">
        <p className="text-sm text-zinc-500">Dashboard &gt; Visão Geral</p>
        <ImportExtractsButton />
      </div>

      {/* Título da seção */}
      <div className="animate-fade-in-up animate-opacity-0 animate-delay-1">
        <h2 className="text-2xl font-bold text-zinc-100">Visão Geral</h2>
        <p className="text-zinc-500 mt-0.5">
          Acompanhe seus indicadores e movimentações
        </p>
      </div>

      {/* Card de boas-vindas */}
      <div className="animate-fade-in-up animate-opacity-0 animate-delay-2">
        <GreetingCard userName="Eduardo Silva" />
      </div>

      {/* KPIs - 4 cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-900 border-zinc-800 animate-fade-in-up animate-opacity-0 animate-delay-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Saldo Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(total)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 animate-fade-in-up animate-opacity-0 animate-delay-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Entradas
            </CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              +{" "}
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(income)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 animate-fade-in-up animate-opacity-0 animate-delay-5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Saídas
            </CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              -{" "}
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(expense)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 animate-fade-in-up animate-opacity-0 animate-delay-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Economia do mês
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(savings)}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {savingsPercent}% da renda
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grid: Fluxo de Caixa + Recentes + Sugestões IA */}
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4 bg-zinc-900 border-zinc-800 animate-fade-in-up animate-opacity-0 animate-delay-7">
          <CardHeader>
            <CardTitle>Fluxo de Caixa</CardTitle>
            <p className="text-sm text-zinc-500">
              Receitas e despesas ao longo do tempo
            </p>
          </CardHeader>
          <CardContent className="pl-2">
            <CashFlowChart data={chartData ?? []} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 bg-zinc-900 border-zinc-800 animate-fade-in-up animate-opacity-0 animate-delay-8">
          <CardHeader>
            <CardTitle>Recentes</CardTitle>
            <p className="text-sm text-zinc-500">Últimas movimentações</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((t) => (
                <div key={t.id} className="flex items-center">
                  <div
                    className={`mr-4 rounded-full p-2 ${t.type === "income" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}
                  >
                    <Activity className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <p className="text-sm font-medium leading-none text-zinc-200 truncate">
                      {t.description ?? "—"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {new Date(t.date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div
                    className={`font-medium shrink-0 ${t.type === "income" ? "text-emerald-500" : "text-red-500"}`}
                  >
                    {t.type === "income" ? "+" : "-"}{" "}
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(Number(t.amount))}
                  </div>
                </div>
              ))}
              {recentTransactions.length === 0 && (
                <p className="text-sm text-zinc-500">
                  Nenhuma transação encontrada.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sugestões de IA */}
      <AISuggestionsCard />
    </div>
  );
}
