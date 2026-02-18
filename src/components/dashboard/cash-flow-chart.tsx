"use client";

import { getTransactionTypeLabel } from "@/lib/transaction-types";
import { useLocale } from "@/lib/use-locale";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type ChartPoint = {
  date: string;
  label: string;
  income: number;
  expense: number;
  saldo: number;
};

export function CashFlowChart({ data }: { data: ChartPoint[] }) {
  const locale = useLocale();
  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(v);

  if (!data || data.length === 0) {
    return (
      <div className="h-[200px] w-full flex items-center justify-center text-zinc-500 border border-dashed border-zinc-700 rounded-md">
        Nenhum dado para exibir neste período.
      </div>
    );
  }

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#71717a", fontSize: 11 }}
            axisLine={{ stroke: "#3f3f46" }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatCurrency}
            tick={{ fill: "#71717a", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #27272a",
              borderRadius: "8px",
              color: "#e4e4e7",
            }}
            labelStyle={{ color: "#a1a1aa" }}
            formatter={(value) => [formatCurrency(Number(value) || 0), ""]}
            labelFormatter={(label) => label}
          />
          <Legend
            wrapperStyle={{ paddingTop: 12 }}
            formatter={(value) => (
              <span className="text-zinc-400 text-sm">
                {getTransactionTypeLabel(value, locale)}
              </span>
            )}
          />
          <Area
            type="monotone"
            dataKey="income"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#colorIncome)"
            name="income"
          />
          <Area
            type="monotone"
            dataKey="expense"
            stroke="#ef4444"
            strokeWidth={2}
            fill="url(#colorExpense)"
            name="expense"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
