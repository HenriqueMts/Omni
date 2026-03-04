"use server";

import Groq from "groq-sdk";
import { createClient } from "@/lib/supabase/server";
import { getDashboardStats } from "@/services/dashboard";

export type FinancialInsight = {
  type: "warning" | "info" | "success";
  message: string;
};

export type GetInsightsResult =
  | { ok: true; insights: FinancialInsight[] }
  | { ok: false; error: string };

const INSIGHTS_PROMPT = `Você é um analista financeiro pessoal do app Omni.
Analise os dados financeiros fornecidos e gere exatamente 3 notificações/insights curtos e valiosos para o usuário.
Seja direto, motivador e use emojis se apropriado (mas com moderação).

Classifique cada insight como:
- "warning": para gastos altos, saldo baixo, aumento de despesas ou alertas de atenção.
- "success": para saldo positivo, economia, redução de gastos ou metas atingidas.
- "info": para dicas gerais, observações neutras ou sugestões de uso do app.

Retorne APENAS um array JSON válido, sem markdown, neste formato exato:
[
  {"type": "warning", "message": "Seus gastos com alimentação subiram 20% esta semana."},
  {"type": "success", "message": "Parabéns! Você economizou R$ 500 este mês."},
  {"type": "info", "message": "Que tal categorizar suas transações recentes para melhor análise?"}
]`;

export async function getFinancialInsights(): Promise<GetInsightsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    // Mock data se não houver chave configurada
    return {
      ok: true,
      insights: [
        {
          type: "info",
          message:
            "Configure sua chave da Groq (IA) para receber insights personalizados em tempo real.",
        },
        {
          type: "success",
          message: "Seu saldo atual está positivo. Continue assim!",
        },
        {
          type: "warning",
          message: "Revise suas transações recentes para garantir que tudo está categorizado.",
        },
      ],
    };
  }

  try {
    // Busca dados reais do dashboard para contexto
    const stats = await getDashboardStats();
    const context = `
      Saldo Total: ${stats.total}
      Entradas (Mês): ${stats.income}
      Saídas (Mês): ${stats.expense}
      Investimentos: ${stats.investment}
      
      (Considere que estamos no dia ${new Date().toLocaleDateString("pt-BR")})
    `;

    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: INSIGHTS_PROMPT },
        { role: "user", content: `Dados atuais do usuário:\n${context}` },
      ],
      temperature: 0.5,
      max_tokens: 500,
    });

    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) throw new Error("Resposta vazia da IA");

    // Limpeza básica para garantir JSON válido
    const cleaned = text.replaceAll(/```json/g, "").replaceAll(/```/g, "").trim();
    const insights = JSON.parse(cleaned) as FinancialInsight[];

    // Garante que retornamos no máximo 3
    return { ok: true, insights: insights.slice(0, 3) };
  } catch (error) {
    console.error("Erro ao gerar insights financeiros:", error);
    return {
      ok: true, // Fallback para não quebrar a UI
      insights: [
        {
          type: "info",
          message: "Estamos analisando seus dados. Tente novamente em alguns instantes.",
        },
        {
          type: "success",
          message: "Mantenha seus registros em dia para obter melhores insights.",
        },
      ],
    };
  }
}
