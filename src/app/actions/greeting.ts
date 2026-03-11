"use server";

import Groq from "groq-sdk";
import { createClient } from "@/lib/supabase/server";

export async function getAIGreeting(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const apiKey = process.env.GROQ_API_KEY;
  if (!user || !apiKey) {
    return "Pronto para manter suas finanças em dia? 🚀";
  }

  try {
    const hour = new Date().getHours();
    const timeContext = hour < 12 ? "manhã" : hour < 18 ? "tarde" : "noite";

    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `Você é um assistente financeiro amigável e motivador.
Gere UMA ÚNICA frase curta motivacional relacionada a finanças/controle/sucesso, adequada para o período da ${timeContext}.
NÃO inclua o nome do usuário na frase (o nome já aparece na interface).
NÃO use aspas. NÃO use "Olá", "Bom dia", "Boa tarde" ou "Boa noite" no início (isso já é exibido na UI). Apenas a frase de efeito.
Exemplos: "Que tal revisar seus investimentos hoje?", "Foco total nas suas metas financeiras!", "Um ótimo momento para planejar seu futuro."
Máximo 60 caracteres.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 60,
    });

    const text = completion.choices[0]?.message?.content?.trim();
    return (
      text?.replace(/^["']|["']$/g, "") ||
      "Pronto para manter suas finanças em dia? 🚀"
    );
  } catch (error) {
    console.error("Erro ao gerar saudação IA:", error);
    return "Pronto para manter suas finanças em dia? 🚀";
  }
}
