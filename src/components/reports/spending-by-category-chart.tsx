"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { SpendingByCategoryItem } from "@/services/reports";

const COLORS = ["#f97316", "#3b82f6", "#22c55e", "#eab308", "#ef4444", "#a855f7"];

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);

export function SpendingByCategoryChart({
  data,
}: {
  data: SpendingByCategoryItem[];
}) {
  if (!data?.length) {
    return (
      <div className="h-[260px] w-full flex items-center justify-center text-zinc-500 border border-dashed border-zinc-700 rounded-lg bg-zinc-900/50">
        Nenhum gasto por categoria neste período.
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: d.categoryName,
    value: d.value,
    percent: d.percent,
  }));

  const total = data.reduce((a, c) => a + c.value, 0);
  const maxItem = data.reduce((a, c) => (c.value > a.value ? c : a), data[0]);

  return (
    <div className="w-full space-y-3">
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
            >
              {chartData.map((_, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                  stroke="#18181b"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #27272a",
                borderRadius: "8px",
                color: "#e4e4e7",
              }}
              formatter={(value, name) => [
                formatCurrency(Number(value) ?? 0),
                name,
              ]}
            />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              formatter={(value) => (
                <span className="text-zinc-400 text-sm">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="text-center border-t border-zinc-800 pt-3">
        <p className="text-lg font-bold text-zinc-100">
          {maxItem.percent.toFixed(0)}% {maxItem.categoryName}
        </p>
        <p className="text-xs text-zinc-500 mt-0.5">
          Total despesas: {formatCurrency(total)}
        </p>
      </div>
    </div>
  );
}
