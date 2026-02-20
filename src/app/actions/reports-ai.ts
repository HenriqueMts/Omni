"use server";

import Groq from "groq-sdk";
import { createClient } from "@/lib/supabase/server";
import type { ReportsData } from "@/services/reports";

export type ReportAIAnalysisResult =
  | { ok: true; analysis: string }
  | { ok: false; error: string };

const ANALYSIS_PROMPT = (summary: string) =>
  `Você é um consultor financeiro pessoal. Com base nos dados do relatório abaixo (em reais), escreva uma análise curta e objetiva em português (2 a 4 parágrafos) com:
1. Visão geral: como está a saúde financeira (receita x despesa, saldo).
2. Gastos por categoria: destaque a maior categoria e sugestão rápida (ex: "Alimentação representa X%; considere definir um teto semanal").
3. Uma recomendação prática para o próximo mês.

Dados do relatório (valores em R$):
${summary}

Responda apenas com o texto da análise, sem título nem marcadores. Use tom amigável e direto.`;

async function runGroqAnalysis(
  prompt: string,
  apiKey: string
): Promise<ReportAIAnalysisResult> {
  const groq = new Groq({ apiKey });
  const model = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
  const completion = await groq.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content:
          "Responda apenas com o texto da análise em português, sem título nem marcadores.",
      },
      { role: "user", content: prompt },
    ],
  });
  const text = completion.choices[0]?.message?.content?.trim();
  if (!text) return { ok: false, error: "Resposta vazia da IA" };
  return { ok: true, analysis: text };
}

export async function getReportAIAnalysis(
  data: ReportsData
): Promise<ReportAIAnalysisResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return { ok: false, error: "API key da IA não configurada (GROQ_API_KEY no .env.local)" };

  const summary = {
    receitaTotal: data.revenue,
    despesaTotal: data.expense,
    saldo: data.balance,
    topCategorias: data.spendingByCategory.slice(0, 5).map((c) => ({
      nome: c.categoryName,
      valor: c.value,
      percentual: c.percent.toFixed(1),
    })),
    totalTransacoesSemana: data.weeklyActivity.totalTransactions,
    gastoSemanal: data.weeklyActivity.totalSpent,
  };
  const summaryStr = JSON.stringify(summary, null, 2);
  const prompt = ANALYSIS_PROMPT(summaryStr);

  try {
    return await runGroqAnalysis(prompt, groqKey);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao gerar análise";
    return { ok: false, error: message };
  }
}
