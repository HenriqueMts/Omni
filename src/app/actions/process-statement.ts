"use server";

import { revalidatePath } from "next/cache";
import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { getAccountsByUserId } from "@/services/accounts";
import { insertExtractedTransactions } from "@/services/transactions";

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
  | { ok: true; transactions: ExtractedTransaction[]; closingBalance: number | null }
  | { ok: false; error: string };

const EXTRACTION_PROMPT = `Você é um analista financeiro especialista em conversão de dados.
Analise o texto bruto deste extrato bancário abaixo e extraia:

1. TODAS as transações financeiras
2. O SALDO ao final do período (saldo final, saldo em conta, saldo disponível, etc.) - geralmente aparece no fim do extrato

Regras para transações:
1. Ignore linhas que não sejam transações (cabeçalhos, rodapés).
2. Sugira a Categoria pela descrição (ex: 'Uber' -> 'Transporte', 'Mcdonalds' -> 'Alimentação').
3. O campo 'type' deve ser apenas 'income' (entradas/depósitos) ou 'expense' (saídas/gastos).
4. Valores em número (ex: 1250.00). Se for negativo no extrato, use valor positivo e type 'expense'.
5. Data no formato ISO YYYY-MM-DD. Use o ano atual se não estiver explícito.

Regras para saldo final:
- Procure por "Saldo final", "Saldo em conta", "Saldo disponível", "Saldo" no fim do extrato.
- Use valor numérico (positivo ou negativo conforme o extrato). Ex: -150.50
- Se não encontrar saldo explícito, calcule: último saldo conhecido +/- transações até a última data.
- Se realmente não for possível determinar, use null para closingBalance.

Retorne um objeto JSON com esta estrutura exata (sem texto antes ou depois):
{
  "transactions": [
    { "date": "YYYY-MM-DD", "description": "Descrição", "amount": 100.00, "type": "expense", "category": "Categoria" }
  ],
  "closingBalance": 1234.56
}

Use closingBalance: null se não conseguir identificar o saldo.

--- DADOS DO EXTRATO ---
`;

async function extractTextFromPdf(
  data: Uint8Array,
  password?: string | null,
): Promise<string> {
  const path = await import("node:path");
  const { pathToFileURL } = await import("node:url");
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const workerPath = path.join(
    process.cwd(),
    "node_modules",
    "pdfjs-dist",
    "legacy",
    "build",
    "pdf.worker.mjs",
  );
  pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;
  const loadingTask = pdfjs.getDocument({
    data,
    password: password && password.trim() ? password : undefined,
    useWorkerFetch: false,
  });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const texts: string[] = [];
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join("");
    texts.push(pageText);
  }
  pdf.destroy();
  return texts.join("\n\n");
}

async function extractTextFromFile(
  file: File,
  password?: string | null,
): Promise<string> {
  if (file.type === "application/pdf") {
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    return extractTextFromPdf(data, password);
  }
  return file.text();
}

type ExtractionResult = {
  transactions: ExtractedTransaction[];
  closingBalance: number | null;
};

function parseExtractionResult(jsonString: string): ExtractionResult {
  const parsed = JSON.parse(jsonString);
  const transactions: ExtractedTransaction[] = [];
  let closingBalance: number | null = null;

  if (Array.isArray(parsed)) {
    // formato antigo: só array
    parsed.forEach((t: unknown) => {
      if (
        t !== null &&
        typeof t === "object" &&
        "date" in t &&
        "description" in t &&
        "amount" in t &&
        "type" in t &&
        "category" in t
      ) {
        transactions.push(t as ExtractedTransaction);
      }
    });
  } else if (parsed && typeof parsed === "object") {
    const list = parsed.transactions ?? parsed.data ?? [];
    if (Array.isArray(list)) {
      list.forEach((t: unknown) => {
        if (
          t !== null &&
          typeof t === "object" &&
          "date" in t &&
          "description" in t &&
          "amount" in t &&
          "type" in t &&
          "category" in t
        ) {
          transactions.push(t as ExtractedTransaction);
        }
      });
    }
    const cb = parsed.closingBalance;
    if (typeof cb === "number" && !Number.isNaN(cb)) {
      closingBalance = cb;
    } else if (typeof cb === "string" && cb.trim() !== "") {
      const n = parseFloat(cb.replace(",", "."));
      if (!Number.isNaN(n)) closingBalance = n;
    }
  }

  return { transactions, closingBalance };
}

/** Usa Groq (preferido) ou Gemini para extrair transações do texto. */
async function extractTransactionsWithAI(
  textContent: string,
): Promise<{ transactions: ExtractedTransaction[]; closingBalance: number | null; error?: string }> {
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
      if (!content) return { transactions: [], closingBalance: null, error: "Resposta vazia do Groq" };
      const { transactions, closingBalance } = parseExtractionResult(content);
      return { transactions, closingBalance };
    } catch (e) {
      console.error("Erro Groq:", e);
      const msg = e instanceof Error ? e.message : String(e);
      return { transactions: [], closingBalance: null, error: msg };
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
      const { transactions, closingBalance } = parseExtractionResult(jsonString);
      return { transactions, closingBalance };
    } catch (e) {
      console.error("Erro Gemini:", e);
      const msg = e instanceof Error ? e.message : String(e);
      return { transactions: [], closingBalance: null, error: msg };
    }
  }

  return {
    transactions: [],
    closingBalance: null,
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
    const pdfPassword = (formData.get("pdfPassword") as string) || null;
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

    // 1. Extrair texto (com senha se PDF protegido)
    const textContent = await extractTextFromFile(file, pdfPassword);
    if (!textContent.trim()) {
      return { ok: false, error: "Não foi possível extrair texto do arquivo." };
    }

    // 2. IA (Groq preferido, senão Gemini) — usa o texto só para extração; não salva o arquivo no storage
    const { transactions, closingBalance, error: aiError } = await extractTransactionsWithAI(textContent);
    if (aiError && transactions.length === 0) {
      return { ok: false, error: aiError };
    }

    revalidatePath("/dashboard/import", "layout");
    return { ok: true, transactions, closingBalance: closingBalance ?? null };
  } catch (err) {
    console.error("Erro ao processar extrato:", err);
    const msg = err instanceof Error ? err.message : String(err);
    if (
      msg.includes("password") ||
      msg.includes("senha") ||
      msg.includes("Password") ||
      msg.includes("NEED_PASSWORD")
    ) {
      return {
        ok: false,
        error:
          "PDF protegido por senha. Ative a opção e informe a senha correta.",
      };
    }
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
  closingBalance: number | null = null,
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
      closingBalance,
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
