"use server";

import { revalidatePath } from "next/cache";
import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { getAccountsByUserId } from "@/services/accounts";
import { insertExtractedTransactions } from "@/services/transactions";

const DOCUMENTS_BUCKET = "documents";
const DOCUMENTS_MAX_BYTES = 10 * 1024 * 1024; // 10MB
const DOCUMENTS_MIMES = [
  "application/pdf",
  "text/plain",
  "application/x-ofx",
  "text/ofx",
] as const;
const DOCUMENTS_EXT = new Set([".pdf", ".txt", ".ofx"]);

export type ExtractedTransaction = {
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
};

export type UploadAndProcessResult =
  | { ok: true; path: string; transactions: ExtractedTransaction[] }
  | { ok: false; error: string };

const EXTRACTION_PROMPT = `Você é um analista financeiro especialista em conversão de dados.
Analise o texto bruto deste extrato bancário abaixo e extraia todas as transações financeiras.

Regras:
1. Ignore linhas que não sejam transações (cabeçalhos, saldos parciais, rodapés).
2. Sugira a Categoria pela descrição (ex: 'Uber' -> 'Transporte', 'Mcdonalds' -> 'Alimentação').
3. O campo 'type' deve ser apenas 'income' (entradas/depósitos) ou 'expense' (saídas/gastos).
4. Valores em número (ex: 1250.00). Se for negativo no extrato, use valor positivo e type 'expense'.
5. Data no formato ISO YYYY-MM-DD. Use o ano atual se não estiver explícito.

Retorne APENAS um array JSON com esta estrutura exata (sem texto antes ou depois):
[
  { "date": "YYYY-MM-DD", "description": "Descrição", "amount": 100.00, "type": "expense", "category": "Categoria" }
]

--- DADOS DO EXTRATO ---
`;

async function extractTextFromFile(file: File): Promise<string> {
  if (file.type === "application/pdf") {
    const pdfParse = (await import("pdf-parse")).default as (
      buffer: Buffer,
    ) => Promise<{ text: string }>;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const data = await pdfParse(buffer);
    return data.text ?? "";
  }
  return file.text();
}

function parseTransactionsFromJson(jsonString: string): ExtractedTransaction[] {
  const parsed = JSON.parse(jsonString);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(
    (t: unknown): t is ExtractedTransaction =>
      t !== null &&
      typeof t === "object" &&
      "date" in t &&
      "description" in t &&
      "amount" in t &&
      "type" in t &&
      "category" in t,
  );
}

/** Usa Groq (preferido) ou Gemini para extrair transações do texto. */
async function extractTransactionsWithAI(
  textContent: string,
): Promise<{ transactions: ExtractedTransaction[]; error?: string }> {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY;

  if (groqKey) {
    try {
      const groq = new Groq({ apiKey: groqKey });
      const model = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
      const completion = await groq.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content:
              "Responda apenas com um array JSON válido, sem markdown nem texto extra.",
          },
          {
            role: "user",
            content: EXTRACTION_PROMPT + textContent.slice(0, 120000),
          },
        ],
        response_format: { type: "json_object" },
      });
      const content = completion.choices[0]?.message?.content;
      if (!content) return { transactions: [], error: "Resposta vazia do Groq" };
      const parsed = JSON.parse(content);
      const list = Array.isArray(parsed)
        ? parsed
        : parsed.transactions ?? parsed.data ?? [];
      const transactions = Array.isArray(list)
        ? list.filter(
            (t: unknown): t is ExtractedTransaction =>
              t !== null &&
              typeof t === "object" &&
              "date" in t &&
              "description" in t &&
              "amount" in t &&
              "type" in t &&
              "category" in t,
          )
        : [];
      return { transactions };
    } catch (e) {
      console.error("Erro Groq:", e);
      const msg = e instanceof Error ? e.message : String(e);
      return { transactions: [], error: msg };
    }
  }

  if (geminiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const modelName =
        process.env.GEMINI_MODEL ?? "gemini-2.0-flash-lite";
      const model = genAI.getGenerativeModel(
        {
          model: modelName,
          generationConfig: { responseMimeType: "application/json" },
        },
        { apiVersion: "v1" },
      );
      const result = await model.generateContent(EXTRACTION_PROMPT + textContent.slice(0, 120000));
      const jsonString = result.response.text();
      const transactions = parseTransactionsFromJson(jsonString);
      return { transactions };
    } catch (e) {
      console.error("Erro Gemini:", e);
      const msg = e instanceof Error ? e.message : String(e);
      return { transactions: [], error: msg };
    }
  }

  return {
    transactions: [],
    error:
      "Nenhum provedor de IA configurado. Defina GROQ_API_KEY (recomendado) ou GOOGLE_GENERATIVE_AI_API_KEY no .env.local",
  };
}

export async function uploadAndProcessStatement(
  formData: FormData,
): Promise<UploadAndProcessResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Não autenticado" };

    const file = formData.get("file") as File | null;
    if (!file?.size) return { ok: false, error: "Nenhum arquivo enviado" };
    if (file.size > DOCUMENTS_MAX_BYTES) {
      return { ok: false, error: "Arquivo maior que 10 MB" };
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    const allowedMime = [...DOCUMENTS_MIMES].includes(
      file.type as (typeof DOCUMENTS_MIMES)[number],
    );
    const allowedExt = ext && DOCUMENTS_EXT.has(`.${ext}`);
    if (!allowedMime && !allowedExt) {
      return { ok: false, error: "Formato inválido. Use PDF, TXT ou OFX." };
    }

    // 1. Extrair texto
    const textContent = await extractTextFromFile(file);
    if (!textContent.trim()) {
      return { ok: false, error: "Não foi possível extrair texto do arquivo." };
    }

    // 2. IA (Groq preferido, senão Gemini)
    const { transactions, error: aiError } = await extractTransactionsWithAI(textContent);
    if (aiError && transactions.length === 0) {
      return { ok: false, error: aiError };
    }

    // 3. Upload do arquivo para o storage
    const safeName = file.name.replaceAll(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
    const path = `${user.id}/${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(path, file, { upsert: false });

    if (uploadError) {
      return {
        ok: false,
        error: `Extração concluída, mas falha ao salvar arquivo: ${uploadError.message}`,
      };
    }

    revalidatePath("/dashboard/import", "layout");
    return { ok: true, path, transactions };
  } catch (err) {
    console.error("Erro ao processar extrato:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Falha ao processar o arquivo com IA.",
    };
  }
}

export type ImportExtractedResult =
  | { ok: true; inserted: number }
  | { ok: false; error: string };

/** Importa as transações extraídas pela IA para a conta selecionada. */
export async function importExtractedTransactions(
  accountId: string,
  transactionsToImport: ExtractedTransaction[],
): Promise<ImportExtractedResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Não autenticado" };

    const accounts = await getAccountsByUserId(user.id);
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return { ok: false, error: "Conta não encontrada" };

    if (transactionsToImport.length === 0) {
      return { ok: false, error: "Nenhuma transação para importar." };
    }

    const { inserted, error } = await insertExtractedTransactions(
      user.id,
      accountId,
      transactionsToImport,
    );
    if (error) return { ok: false, error };

    revalidatePath("/dashboard", "layout");
    revalidatePath("/dashboard/import", "layout");
    return { ok: true, inserted };
  } catch (err) {
    console.error("Erro ao importar transações:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Falha ao importar transações.",
    };
  }
}
