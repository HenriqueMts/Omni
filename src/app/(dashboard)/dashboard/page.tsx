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

export default async function DashboardPage() {
  const { income, expense, total, recentTransactions } =
    await getDashboardStats();

  const savings = income - expense;
  const savingsPercent =
    income > 0 ? Math.round((savings / income) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb + período (estilo referência) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-500">Dashboard &gt; Visão Geral</p>
        <div className="flex items-center gap-2">
          <select className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50">
            <option>Este mês</option>
            <option>Este trimestre</option>
            <option>Este ano</option>
          </select>
          <button
            type="button"
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            Exportar
          </button>
        </div>
      </div>

      {/* Título da seção */}
      <div>
        <h2 className="text-2xl font-bold text-zinc-100">Visão Geral</h2>
        <p className="text-zinc-500 mt-0.5">
          Acompanhe seus indicadores e movimentações
        </p>
      </div>

      {/* Card de boas-vindas (estilo referência) */}
      <GreetingCard userName="Eduardo Silva" />

      {/* KPIs - 4 cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-900 border-zinc-800">
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

        <Card className="bg-zinc-900 border-zinc-800">
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

        <Card className="bg-zinc-900 border-zinc-800">
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

        <Card className="bg-zinc-900 border-zinc-800">
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

      {/* Grid: Fluxo de Caixa + Recentes + Insights */}
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4 bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle>Fluxo de Caixa</CardTitle>
            <p className="text-sm text-zinc-500">
              Receitas e despesas ao longo do tempo
            </p>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[200px] w-full flex items-center justify-center text-zinc-500 border border-dashed border-zinc-700 rounded-md">
              Gráfico será implementado aqui
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 bg-zinc-900 border-zinc-800">
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
                      {t.description}
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

      {/* Insights (estilo referência - analytics) */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle>Insights</CardTitle>
          <p className="text-sm text-zinc-500">
            Análise e sugestões (em breve com IA)
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Controle de gastos</span>
                <span className="text-zinc-100 font-medium">—</span>
              </div>
              <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500/80"
                  style={{ width: "0%" }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Meta de economia</span>
                <span className="text-zinc-100 font-medium">—</span>
              </div>
              <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500/80"
                  style={{ width: "0%" }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Resposta da IA</span>
                <span className="text-zinc-100 font-medium">Em breve</span>
              </div>
              <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-zinc-600"
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
