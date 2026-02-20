"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpCircle, ArrowDownCircle, TrendingUp, CreditCard } from "lucide-react";
import { RevenueExpensesChart } from "./revenue-expenses-chart";
import { SpendingByCategoryChart } from "./spending-by-category-chart";
import { ReportsAIAnalysis } from "./reports-ai-analysis";
import type { ReportsData } from "@/services/reports";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);

export function ReportsContent({ data }: { data: ReportsData }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in-up animate-opacity-0">
        <p className="text-sm text-zinc-500">Dashboard &gt; Relatórios</p>
        <Link href="/dashboard/transactions">
          <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-400">
            Ver transações
          </Button>
        </Link>
      </div>

      <div className="animate-fade-in-up animate-opacity-0 animate-delay-1">
        <h2 className="text-2xl font-bold text-zinc-100">Relatórios</h2>
        <p className="text-zinc-500 mt-0.5">
          Análise de receitas, despesas e gastos por categoria
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-1 min-[500px]:grid-cols-2 lg:grid-cols-4 animate-fade-in-up animate-opacity-0 animate-delay-2">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Receita (ano)
            </CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-500">
              {formatCurrency(data.revenue)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Despesas (ano)
            </CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-500">
              {formatCurrency(data.expense)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Saldo
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-zinc-100">
              {formatCurrency(data.balance)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Faturas de cartão (ano)
            </CardTitle>
            <CreditCard className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-zinc-100">
              {formatCurrency(data.creditCardInvoices.totalAmount)}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              {data.creditCardInvoices.count} fatura(s) importada(s)
            </p>
            {data.creditCardInvoices.invoices.length > 0 && (
              <Link
                href="/dashboard/cards"
                className="text-xs text-emerald-500 hover:underline mt-2 inline-block"
              >
                Ver cartões
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Receita x Despesas + Gastos por categoria */}
      <div className="grid gap-4 lg:grid-cols-2 animate-fade-in-up animate-opacity-0 animate-delay-3">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-100">Receita vs Despesas</CardTitle>
            <p className="text-sm text-zinc-500">
              Valores mensais do ano atual
            </p>
          </CardHeader>
          <CardContent>
            <RevenueExpensesChart data={data.revenueExpensesChart} />
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-100">Gastos por categoria</CardTitle>
            <p className="text-sm text-zinc-500">
              Distribuição das despesas no ano
            </p>
          </CardHeader>
          <CardContent>
            <SpendingByCategoryChart data={data.spendingByCategory} />
          </CardContent>
        </Card>
      </div>

      {/* Atividade semanal + Transações recentes */}
      <div className="grid gap-4 lg:grid-cols-2 animate-fade-in-up animate-opacity-0 animate-delay-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-100">Atividade semanal</CardTitle>
            <p className="text-sm text-zinc-500">
              Últimos 7 dias
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-xs text-zinc-500">Transações</p>
                <p className="text-lg font-semibold text-zinc-100">
                  {data.weeklyActivity.totalTransactions}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Total gasto</p>
                <p className="text-lg font-semibold text-red-500">
                  {formatCurrency(data.weeklyActivity.totalSpent)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Média/dia</p>
                <p className="text-lg font-semibold text-zinc-100">
                  {data.weeklyActivity.dailyAvg}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.weeklyActivity.days.map((d) => (
                <div
                  key={d.day}
                  className="flex flex-col items-center rounded-lg bg-zinc-800/80 px-3 py-2 min-w-[48px]"
                >
                  <span className="text-xs text-zinc-500">{d.label}</span>
                  <span className="text-sm font-medium text-zinc-200">
                    {d.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-100">Transações recentes</CardTitle>
            <p className="text-sm text-zinc-500">
              Últimas do ano
            </p>
          </CardHeader>
          <CardContent>
            {data.recentTransactions.length === 0 ? (
              <p className="text-sm text-zinc-500 py-4">
                Nenhuma transação no período.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400">Descrição</TableHead>
                    <TableHead className="text-zinc-400">Categoria</TableHead>
                    <TableHead className="text-zinc-400">Data</TableHead>
                    <TableHead className="text-zinc-400 text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentTransactions.map((t) => (
                    <TableRow
                      key={t.id}
                      className="border-zinc-800 hover:bg-zinc-800/50"
                    >
                      <TableCell className="text-zinc-200 font-medium max-w-[180px] truncate">
                        {t.description || "—"}
                      </TableCell>
                      <TableCell className="text-zinc-400">
                        {t.categoryName ?? "—"}
                      </TableCell>
                      <TableCell className="text-zinc-400">
                        {new Date(t.date + "T12:00:00").toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        <span
                          className={
                            t.type === "income"
                              ? "text-emerald-500"
                              : t.type === "expense"
                                ? "text-red-500"
                                : "text-zinc-400"
                          }
                        >
                          {t.type === "income" ? "+" : t.type === "expense" ? "−" : ""}
                          {formatCurrency(Number(t.amount))}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Análise IA */}
      <div className="animate-fade-in-up animate-opacity-0 animate-delay-5">
        <ReportsAIAnalysis data={data} />
      </div>
    </div>
  );
}
