"use server";

import { revalidatePath } from "next/cache";
import Groq from "groq-sdk";
import { createClient } from "@/lib/supabase/server";
import { getCreditCardById } from "@/services/credit-cards";
import {
  createCreditCardInvoice,
  getInvoiceItems,
} from "@/services/credit-card-invoices";
import { extractTextFromFile } from "@/lib/pdf";

const FATURA_EXTRACTION_PROMPT = `Você é um analista financeiro. Analise o texto bruto de uma FATURA de cartão de crédito abaixo e extraia:

1. Período da fatura: data de início e fim do período (formato YYYY-MM-DD). Use o ano atual se não estiver explícito.
2. Data de vencimento (formato YYYY-MM-DD), se aparecer.
3. Valor total da fatura (número positivo, ex: 1500.00).
4. Lista de lançamentos: para cada compra/gasto na fatura, extraia descrição (estabelecimento ou texto resumido), valor (número positivo), data da compra (YYYY-MM-DD se houver), e parcelas (ex: "1/3" em installmentsCurrent e installmentsTotal como "3").

Regras:
- Valores sempre em número (ex: 99.90). Ignore sinais negativos; considere como valor da compra.
- Se uma data não existir, use null para esse campo.
- Descrição: texto curto e legível do estabelecimento/lançamento.

Retorne APENAS um objeto JSON válido, sem texto antes ou depois, nesta estrutura exata:
{
  "periodStart": "YYYY-MM-DD",
  "periodEnd": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD ou null",
  "totalAmount": 1234.56,
  "items": [
    {
      "description": "Descrição do lançamento",
      "amount": 99.90,
      "date": "YYYY-MM-DD ou null",
      "installmentsCurrent": "1 ou null",
      "installmentsTotal": "3 ou null"
    }
  ]
}

--- TEXTO DA FATURA ---
`;

const SUGGESTIONS_PROMPT = (summary: string) =>
  `Com base nesta fatura de cartão de crédito, escreva 2 a 4 frases curtas em português com sugestões de saúde financeira (ex: evitar parcelar demais, cuidado com gastos em restaurantes, pagar antes do vencimento). Seja objetivo e amigável.

Resumo: ${summary}

Responda apenas com o texto das sugestões, sem título nem marcadores.`;

export type ProcessCreditCardInvoiceResult =
  | {
      ok: true;
      invoiceId: string;
      totalAmount: string;
      periodEnd: string;
      aiSuggestions: string | null;
    }
  | { ok: false; error: string };

export async function processCreditCardInvoice(
  creditCardId: string,
  formData: FormData,
): Promise<ProcessCreditCardInvoiceResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const card = await getCreditCardById(creditCardId, user.id);
  if (!card) return { ok: false, error: "Cartão não encontrado" };

  const file = formData.get("file") as File | null;
  if (!file || !(file instanceof File))
    return { ok: false, error: "Envie um arquivo da fatura (PDF, CSV ou OFX)" };
  const allowedMimes = [
    "application/pdf",
    "text/csv",
    "application/csv",
    "text/plain",
    "application/x-ofx",
    "text/x-ofx",
    "application/vnd.ms-excel",
  ];
  const name = (file.name || "").toLowerCase();
  const allowedExt = name.endsWith(".pdf") || name.endsWith(".csv") || name.endsWith(".ofx");
  const allowedType = allowedMimes.includes(file.type) || file.type === "";
  if (!allowedExt && !allowedType)
    return { ok: false, error: "Use um arquivo PDF, CSV ou OFX da fatura" };
  const maxBytes = 10 * 1024 * 1024;
  if (file.size > maxBytes) return { ok: false, error: "Arquivo muito grande (máx. 10MB)" };

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return { ok: false, error: "Configuração de IA indisponível" };

  try {
    const rawText = await extractTextFromFile(file);
    if (!rawText.trim()) return { ok: false, error: "Não foi possível extrair o conteúdo do arquivo" };

    const groq = new Groq({ apiKey });
    const model = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

    const extractionCompletion = await groq.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "Responda apenas com um objeto JSON válido, sem markdown e sem texto antes ou depois.",
        },
        { role: "user", content: FATURA_EXTRACTION_PROMPT + rawText },
      ],
    });
    const jsonText = extractionCompletion.choices[0]?.message?.content?.trim();
    if (!jsonText) return { ok: false, error: "IA não retornou dados da fatura" };

    const parsed = parseFaturaJson(jsonText);
    if (!parsed)
      return { ok: false, error: "Não foi possível interpretar os dados extraídos da fatura" };

    const summaryForSuggestions = `Total: R$ ${Number(parsed.totalAmount).toFixed(2)}; Período: ${parsed.periodStart} a ${parsed.periodEnd}; ${parsed.items.length} lançamentos.`;
    let aiSuggestions: string | null = null;
    try {
      const suggestionsCompletion = await groq.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: "Responda apenas com o texto em português, sem título.",
          },
          { role: "user", content: SUGGESTIONS_PROMPT(summaryForSuggestions) },
        ],
      });
      aiSuggestions = suggestionsCompletion.choices[0]?.message?.content?.trim() ?? null;
    } catch {
      // optional; continue without suggestions
    }

    const invoice = await createCreditCardInvoice(
      {
        creditCardId,
        userId: user.id,
        periodStart: parsed.periodStart,
        periodEnd: parsed.periodEnd,
        dueDate: parsed.dueDate ?? null,
        totalAmount: String(parsed.totalAmount),
        aiSummary: null,
        aiSuggestions,
      },
      parsed.items.map((item) => ({
        description: item.description ?? null,
        amount: String(item.amount),
        date: item.date ?? null,
        installmentsCurrent: item.installmentsCurrent ?? null,
        installmentsTotal: item.installmentsTotal ?? null,
      })),
    );

    revalidatePath("/dashboard/cards");
    revalidatePath("/dashboard", "layout");
    return {
      ok: true,
      invoiceId: invoice.id,
      totalAmount: invoice.totalAmount,
      periodEnd: invoice.periodEnd,
      aiSuggestions: invoice.aiSuggestions,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao processar fatura";
    return { ok: false, error: message };
  }
}

type FaturaParsed = {
  periodStart: string;
  periodEnd: string;
  dueDate: string | null;
  totalAmount: number;
  items: {
    description: string | null;
    amount: number;
    date: string | null;
    installmentsCurrent: string | null;
    installmentsTotal: string | null;
  }[];
};

function parseFaturaJson(jsonString: string): FaturaParsed | null {
  try {
    const cleaned = jsonString.replaceAll(/```json?\s*|\s*```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (!parsed || typeof parsed.periodStart !== "string" || typeof parsed.periodEnd !== "string")
      return null;
    const totalAmount = Number(parsed.totalAmount);
    if (Number.isNaN(totalAmount) || totalAmount < 0) return null;
    const items = Array.isArray(parsed.items)
      ? parsed.items.map((item: Record<string, unknown>) => ({
          description: typeof item.description === "string" ? item.description : null,
          amount: Number(item.amount) || 0,
          date: typeof item.date === "string" ? item.date : null,
          installmentsCurrent:
            typeof item.installmentsCurrent === "string" || typeof item.installmentsCurrent === "number"
              ? String(item.installmentsCurrent)
              : null,
          installmentsTotal:
            typeof item.installmentsTotal === "string" || typeof item.installmentsTotal === "number"
              ? String(item.installmentsTotal)
              : null,
        }))
      : [];
    return {
      periodStart: parsed.periodStart,
      periodEnd: parsed.periodEnd,
      dueDate: typeof parsed.dueDate === "string" ? parsed.dueDate : null,
      totalAmount,
      items,
    };
  } catch {
    return null;
  }
}

export async function getInvoiceWithItems(invoiceId: string) {
  const { getInvoicesByUserId } = await import("@/services/credit-card-invoices");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const invoices = await getInvoicesByUserId(user.id);
  const invoice = invoices.find((i) => i.id === invoiceId);
  if (!invoice) return null;
  const items = await getInvoiceItems(invoiceId);
  return { invoice, items };
}
