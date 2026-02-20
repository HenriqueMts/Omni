"use server";

import Groq from "groq-sdk";
import { createClient } from "@/lib/supabase/server";
import { getDashboardStats } from "@/services/dashboard";

const SYSTEM_PROMPT = `Você é o assistente financeiro do Omni, um app de controle financeiro pessoal. Responda sempre em português, de forma clara e objetiva.
O usuário pode ter contas, transações, extratos importados, cartão de crédito e relatórios. Ajude com: resumos, dicas de economia, análise de gastos, metas, planejamento e dúvidas sobre finanças pessoais. Se não tiver dados suficientes para uma análise específica, sugira que importe extratos ou cadastre transações.`;

const SUGGESTIONS_PROMPT = `Você é um assistente do app financeiro Omni. Gere exatamente 6 sugestões curtas (frases que o usuário poderia clicar para perguntar ao assistente). Todas no contexto financeiro pessoal: resumo do mês, como economizar, analisar gastos, metas, dicas, planejamento, etc.
Retorne APENAS um JSON array de 6 strings em português, sem numeração nem markdown. Exemplo: ["Resumo das minhas finanças este mês","Como posso economizar mais?","Quais gastos posso cortar?"]
Máximo 40 caracteres por sugestão.`;

export type AIChatSuggestionsResult =
  | { ok: true; suggestions: string[] }
  | { ok: false; error: string };

export async function getAIChatSuggestions(): Promise<AIChatSuggestionsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      ok: true,
      suggestions: [
        "Resumo das minhas finanças este mês",
        "Como posso economizar mais?",
        "Quais gastos posso cortar?",
        "Me ajude a definir metas",
        "Dicas para organizar meu orçamento",
        "Analisar meus gastos por categoria",
      ],
    };
  }

  try {
    const groq = new Groq({ apiKey });
    const model = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
    const completion = await groq.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: "Retorne apenas um array JSON de 6 strings, sem texto antes ou depois.",
        },
        { role: "user", content: SUGGESTIONS_PROMPT },
      ],
    });
    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) return { ok: true, suggestions: getFallbackSuggestions() };
    const cleaned = text.replaceAll(/```json?\s*|\s*```/g, "").trim();
    const parsed = JSON.parse(cleaned) as unknown;
    const arr = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
    const suggestions = arr.slice(0, 6).map((s) => String(s).slice(0, 45));
    if (suggestions.length === 0) return { ok: true, suggestions: getFallbackSuggestions() };
    return { ok: true, suggestions };
  } catch {
    return { ok: true, suggestions: getFallbackSuggestions() };
  }
}

function getFallbackSuggestions(): string[] {
  return [
    "Resumo das minhas finanças este mês",
    "Como posso economizar mais?",
    "Quais gastos posso cortar?",
    "Me ajude a definir metas",
    "Dicas para organizar meu orçamento",
    "Analisar meus gastos por categoria",
  ];
}

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type SendAIChatMessageResult =
  | { ok: true; reply: string }
  | { ok: false; error: string };

export async function sendAIChatMessage(
  messages: ChatMessage[],
  newUserMessage: string,
): Promise<SendAIChatMessageResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return { ok: false, error: "Assistente indisponível. Configure GROQ_API_KEY." };

  const trimmed = newUserMessage.trim();
  if (!trimmed) return { ok: false, error: "Digite uma mensagem." };

  try {
    let contextPrompt = SYSTEM_PROMPT;
    try {
      const stats = await getDashboardStats();
      const ctx = `Dados atuais do usuário (valores em R$): Saldo total ${stats.total}; Entradas do mês ${stats.income}; Saídas ${stats.expense}; Investimentos ${stats.investment}. Use apenas para contexto, não invente números.`;
      contextPrompt = `${SYSTEM_PROMPT}\n\n${ctx}`;
    } catch {
      // keep default system prompt
    }

    const groq = new Groq({ apiKey });
    const model = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

    const apiMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: contextPrompt },
      ...messages.slice(-14).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: trimmed },
    ];

    const completion = await groq.chat.completions.create({
      model,
      messages: apiMessages,
    });
    const reply = completion.choices[0]?.message?.content?.trim();
    if (!reply) return { ok: false, error: "Resposta vazia. Tente de novo." };
    return { ok: true, reply };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao enviar mensagem";
    return { ok: false, error: message };
  }
}
