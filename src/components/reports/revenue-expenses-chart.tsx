"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { RevenueExpensePoint } from "@/services/reports";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);

export function RevenueExpensesChart({
  data,
}: {
  data: RevenueExpensePoint[];
}) {
  if (!data?.length) {
    return (
      <div className="h-[240px] w-full flex items-center justify-center text-zinc-500 border border-dashed border-zinc-700 rounded-lg bg-zinc-900/50">
        Nenhum dado para exibir neste período.
      </div>
    );
  }

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#27272a"
            vertical={false}
          />
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
            formatter={(value, name) => [
              formatCurrency(Number(value) ?? 0),
              name === "revenue" ? "Receita" : "Despesas",
            ]}
            labelFormatter={(label) => label}
          />
          <Legend
            wrapperStyle={{ paddingTop: 8 }}
            formatter={(value) => (
              <span className="text-zinc-400 text-sm">
                {value === "revenue" ? "Receita" : "Despesas"}
              </span>
            )}
          />
          <Bar
            dataKey="expense"
            name="Despesas"
            fill="#3f3f46"
            radius={[4, 4, 0, 0]}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            name="Receita"
            stroke="#f97316"
            strokeWidth={2}
            dot={{ fill: "#f97316", r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
