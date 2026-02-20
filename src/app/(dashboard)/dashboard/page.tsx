import { getDashboardStats } from "@/services/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  DollarSign,
  Activity,
  TrendingUp,
  LineChart,
} from "lucide-react";
import { GreetingCard } from "@/components/dashboard/greeting-card";
import { CashFlowChart } from "@/components/dashboard/cash-flow-chart";
import { AISuggestionsCard } from "@/components/dashboard/ai-suggestions-card";
import { ImportExtractsButton } from "@/components/dashboard/import-extracts-button";

export default async function DashboardPage() {
  const { income, expense, investment, total, recentTransactions, chartData } =
    await getDashboardStats();

  const savings = income - expense;
  const savingsPercent =
    income > 0 ? Math.round((savings / income) * 100) : 0;

  return (
    <div className="w-full min-w-0 space-y-6">
      {/* Breadcrumb + Importar extratos */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in-up animate-opacity-0">
        <p className="text-sm text-zinc-500">Dashboard &gt; Visão Geral</p>
        <ImportExtractsButton />
      </div>

      {/* Título da seção */}
      <div className="animate-fade-in-up animate-opacity-0 animate-delay-1">
        <h2 className="text-xl font-bold text-zinc-100 sm:text-2xl">Visão Geral</h2>
        <p className="text-sm text-zinc-500 mt-0.5 sm:text-base">
          Acompanhe seus indicadores e movimentações
        </p>
      </div>

      {/* Card de boas-vindas */}
      <div className="animate-fade-in-up animate-opacity-0 animate-delay-2">
        <GreetingCard userName="Eduardo Silva" />
      </div>

      {/* KPIs: largura mínima por card; quando não couber, o card desce para a próxima linha */}
      <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(12.5rem,1fr))]">
        <Card className="min-w-0 bg-zinc-900 border-zinc-800 animate-fade-in-up animate-opacity-0 animate-delay-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Saldo Total
            </CardTitle>
            <DollarSign className="h-4 w-4 shrink-0 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-zinc-100 break-words sm:text-2xl">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(total)}
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0 bg-zinc-900 border-zinc-800 animate-fade-in-up animate-opacity-0 animate-delay-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Entradas
            </CardTitle>
            <ArrowUpCircle className="h-4 w-4 shrink-0 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-emerald-500 break-words sm:text-2xl flex items-baseline gap-1">
              <span className="shrink-0">+</span>
              <span>{new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(income)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0 bg-zinc-900 border-zinc-800 animate-fade-in-up animate-opacity-0 animate-delay-5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Saídas
            </CardTitle>
            <ArrowDownCircle className="h-4 w-4 shrink-0 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-red-500 break-words sm:text-2xl flex items-baseline gap-1">
              <span className="shrink-0">−</span>
              <span>{new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(expense)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0 bg-zinc-900 border-zinc-800 animate-fade-in-up animate-opacity-0 animate-delay-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Investimentos
            </CardTitle>
            <LineChart className="h-4 w-4 shrink-0 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-amber-500 break-words sm:text-2xl">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(investment)}
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0 bg-zinc-900 border-zinc-800 animate-fade-in-up animate-opacity-0 animate-delay-7">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Economia do mês
            </CardTitle>
            <TrendingUp className="h-4 w-4 shrink-0 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-zinc-100 sm:text-2xl">
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

      {/* Resultado do mês + Transações: empilhado até ter espaço; lado a lado só em xl+ */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-7 animate-fade-in-up animate-opacity-0 animate-delay-8">
        <Card className="min-w-0 min-[480px]:min-w-[20rem] bg-zinc-900 border-zinc-800 xl:col-span-4">
          <CardHeader>
            <CardTitle className="text-zinc-100">Resultado do mês</CardTitle>
            <p className="text-sm text-zinc-500">
              Entradas e Saídas
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`text-lg font-bold sm:text-2xl flex items-baseline gap-1 ${savings >= 0 ? "text-emerald-500" : "text-red-500"}`}>
              {savings >= 0 && <span className="shrink-0">+</span>}
              {savings < 0 && <span className="shrink-0">−</span>}
              <span>{new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(Math.abs(savings))}</span>
            </div>
            <div className="space-y-2">
              <div className="flex h-8 w-full overflow-hidden rounded-lg bg-zinc-800">
                {income + expense > 0 ? (
                  <>
                    <div
                      className="h-full bg-emerald-600 flex items-center justify-start pl-2 min-w-0 transition-all"
                      style={{ width: `${(income / (income + expense)) * 100}%` }}
                      title={`Entradas ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(income)}`}
                    >
                      {income / (income + expense) >= 0.2 && (
                        <span className="text-xs font-medium text-white truncate text-left">
                          Entradas {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(income)}
                        </span>
                      )}
                    </div>
                    <div
                      className="h-full bg-red-600 flex items-center justify-end pr-2 min-w-0 transition-all"
                      style={{ width: `${(expense / (income + expense)) * 100}%` }}
                      title={`Saídas ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(expense)}`}
                    >
                      {expense / (income + expense) >= 0.2 && (
                        <span className="text-xs font-medium text-white truncate text-right">
                          Saídas {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(expense)}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="w-full flex items-center justify-center text-zinc-500 text-sm">
                    Nenhuma movimentação no mês
                  </div>
                )}
              </div>
              {income > 0 && (
                <div className="flex justify-between text-xs text-zinc-500 w-full">
                  <span className="text-left">Economizado {savingsPercent}%</span>
                  <span className="text-right">Gasto {income > 0 ? Math.round((expense / income) * 100) : 0}%</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0 min-[480px]:min-w-[20rem] bg-zinc-900 border-zinc-800 xl:col-span-3">
          <CardHeader>
            <CardTitle>Transações recentes</CardTitle>
            <p className="text-sm text-zinc-500">Últimas movimentações</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((t) => (
                <div key={t.id} className="flex items-center gap-3">
                  <div
                    className={`shrink-0 rounded-full p-2 ${t.type === "income" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}
                  >
                    <Activity className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-0.5 min-w-0">
                    <p className="text-sm font-medium leading-none text-zinc-200 line-clamp-2 break-words" title={t.description ?? undefined}>
                      {t.description ?? "—"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {new Date(t.date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div
                    className={`font-medium shrink-0 whitespace-nowrap ${t.type === "income" ? "text-emerald-500" : "text-red-500"}`}
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

      {/* Fluxo de Caixa (largura total, scroll horizontal no mobile se necessário) */}
      <Card className="min-w-0 w-full overflow-hidden bg-zinc-900 border-zinc-800 animate-fade-in-up animate-opacity-0 animate-delay-9">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Fluxo de Caixa</CardTitle>
          <p className="text-sm text-zinc-500">
            Entradas e saídas ao longo do tempo
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto pl-2 min-w-0">
          <CashFlowChart data={chartData ?? []} />
        </CardContent>
      </Card>

      {/* Sugestões de IA */}
      <AISuggestionsCard />
    </div>
  );
}
