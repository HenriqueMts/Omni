"use server";

import { revalidatePath } from "next/cache";
import Groq from "groq-sdk";
import { createClient } from "@/lib/supabase/server";
import { getAccountsByUserId } from "@/services/accounts";
import { getTransactions, insertExtractedTransactions } from "@/services/transactions";

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
6. INVESTIMENTOS: Não considere investimentos como saídas comuns. Transações de aplicação financeira, CDB, Tesouro Direto, fundos, previdência, compra de ações/ativos ou qualquer movimento para investimento devem ter categoria exatamente "Investimento" (e type 'expense'). Ex.: "Aplicação CDB", "Resgate fundo", "Tesouro Selic" -> category "Investimento".

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

import { extractTextFromFile } from "@/lib/pdf";

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

/** Usa Groq para extrair transações do texto. */
async function extractTransactionsWithAI(
  textContent: string,
): Promise<{ transactions: ExtractedTransaction[]; closingBalance: number | null; error?: string }> {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    return {
      transactions: [],
      closingBalance: null,
      error: "Defina GROQ_API_KEY no .env.local",
    };
  }
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

    // 2. IA (Groq) — extração do texto; arquivo não é salvo no storage
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

// --- Análise de transferências entre contas do mesmo titular ---

const TRANSFER_ANALYSIS_DAYS = 90;
const TRANSFER_ANALYSIS_LIMIT = 600;

export type InternalTransferPair = {
  accountOut: string;
  accountIn: string;
  amount: number;
  date: string;
  descriptionOut: string;
  descriptionIn: string;
  relevantForTotals: boolean;
};

export type AnalyzeTransfersResult =
  | { ok: true; analysis: { summary: string; pairs: InternalTransferPair[] } }
  | { ok: true; skipped: true; reason: string }
  | { ok: false; error: string };

const TRANSFER_ANALYSIS_PROMPT = (payload: string) =>
  `Você é um analista financeiro. Foi fornecida uma lista de contas do MESMO titular e as transações recentes de cada conta.

Sua tarefa:
1. Identificar pares (ou conjuntos) de transações que representam TRANSFERÊNCIAS ENTRE ESSAS CONTAS do mesmo titular (ex.: saída em uma conta e entrada de mesmo valor em outra, mesmo dia ou próximo; descrições como TED, PIX, DOC, transferência, etc.).
2. Para cada par identificado, indique se é relevante para o somatório de receitas e despesas. Transferências entre contas do mesmo titular NÃO são relevantes (não contam como receita nem despesa).

Regras:
- Considere apenas transações entre as contas listadas (mesmo titular).
- Valores devem bater (saída em uma = entrada em outra, mesmo valor).
- Datas iguais ou até 2 dias de diferença.
- Retorne um JSON com esta estrutura exata (sem texto antes ou depois):
{
  "summary": "Resumo em português: quantas transferências encontrou e que não entram no somatório.",
  "pairs": [
    {
      "accountOut": "Nome da conta de saída",
      "accountIn": "Nome da conta de entrada",
      "amount": número,
      "date": "YYYY-MM-DD",
      "descriptionOut": "Descrição da saída",
      "descriptionIn": "Descrição da entrada",
      "relevantForTotals": false
    }
  ]
}

Se não encontrar nenhum par de transferência entre as contas, retorne: { "summary": "Nenhuma transferência entre suas contas identificada no período.", "pairs": [] }

Dados (contas e transações por conta):
${payload}`;

function parseTransferAnalysisResult(jsonString: string): {
  summary: string;
  pairs: InternalTransferPair[];
} {
  const parsed = JSON.parse(jsonString);
  const pairs: InternalTransferPair[] = Array.isArray(parsed.pairs)
    ? parsed.pairs.map((p: Record<string, unknown>) => ({
        accountOut: String(p.accountOut ?? ""),
        accountIn: String(p.accountIn ?? ""),
        amount: Number(p.amount) || 0,
        date: String(p.date ?? ""),
        descriptionOut: String(p.descriptionOut ?? ""),
        descriptionIn: String(p.descriptionIn ?? ""),
        relevantForTotals: Boolean(p.relevantForTotals),
      }))
    : [];
  return {
    summary: String(parsed.summary ?? "Análise concluída."),
    pairs,
  };
}

async function runTransferAnalysisWithAI(
  payload: string,
): Promise<{ summary: string; pairs: InternalTransferPair[]; error?: string }> {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    return { summary: "", pairs: [], error: "Defina GROQ_API_KEY no .env.local" };
  }
  try {
    const groq = new Groq({ apiKey: groqKey });
    const model = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
    const completion = await groq.chat.completions.create({
      model,
      messages: [
        { role: "system", content: "Responda apenas com um objeto JSON válido, sem markdown nem texto extra." },
        { role: "user", content: TRANSFER_ANALYSIS_PROMPT(payload.slice(0, 80000)) },
      ],
      response_format: { type: "json_object" },
    });
    const content = completion.choices[0]?.message?.content;
    if (!content) return { summary: "", pairs: [], error: "Resposta vazia da IA" };
    return parseTransferAnalysisResult(content);
  } catch (e) {
    console.error("Erro Groq (análise transferências):", e);
    return { summary: "", pairs: [], error: e instanceof Error ? e.message : String(e) };
  }
}

/** Analisa transações de todas as contas do usuário e identifica transferências entre contas do mesmo titular. */
export async function analyzeTransfersBetweenOwnAccounts(): Promise<AnalyzeTransfersResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Não autenticado" };

    const accounts = await getAccountsByUserId(user.id);
    if (accounts.length < 2) {
      return { ok: true, skipped: true, reason: "A análise de transferências entre contas exige pelo menos duas contas." };
    }

    const from = new Date();
    from.setDate(from.getDate() - TRANSFER_ANALYSIS_DAYS);
    const dateFrom = from.toISOString().slice(0, 10);

    const allRows = await getTransactions(user.id, {
      dateFrom,
      limit: TRANSFER_ANALYSIS_LIMIT,
    });

    const byAccount = new Map<
      string,
      { accountName: string; transactions: { date: string; description: string | null; amount: string; type: string }[] }
    >();
    for (const row of allRows) {
      const aid = row.accountId ?? "unknown";
      const name = row.accountName ?? aid;
      if (!byAccount.has(aid)) byAccount.set(aid, { accountName: name, transactions: [] });
      byAccount.get(aid)!.transactions.push({
        date: row.date,
        description: row.description,
        amount: String(row.amount),
        type: row.type,
      });
    }

    const payload = JSON.stringify(
      {
        accounts: Array.from(byAccount.entries()).map(([id, { accountName }]) => ({ id, name: accountName })),
        transactionsByAccount: Array.from(byAccount.entries()).map(([accountId, { accountName, transactions }]) => ({
          accountId,
          accountName,
          transactions: transactions.slice(0, 200),
        })),
      },
      null,
      2,
    );

    const { summary, pairs, error } = await runTransferAnalysisWithAI(payload);
    if (error) return { ok: false, error };

    return { ok: true, analysis: { summary, pairs } };
  } catch (err) {
    console.error("Erro ao analisar transferências:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Falha ao analisar transferências.",
    };
  }
}
