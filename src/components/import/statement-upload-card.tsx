"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { uploadAndProcessStatement, importExtractedTransactions } from "@/app/actions/process-statement";
import type { ExtractedTransaction } from "@/app/actions/process-statement";
import type { Account } from "@/db/schema";
import { FileText, Upload, Loader2, Download } from "lucide-react";

const ACCEPT =
  ".pdf,.txt,.ofx,application/pdf,text/plain,application/x-ofx,text/ofx";
const MAX_MB = 10;

type Props = Readonly<{ accounts: Account[] }>;

export function StatementUploadCard({ accounts }: Props) {
  const router = useRouter();
  const inputId = "statement-file-input";
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<ExtractedTransaction[] | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setSuccess(null);
    setTransactions(null);
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Arquivo deve ter no máximo ${MAX_MB} MB.`);
      e.target.value = "";
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadAndProcessStatement(formData);
    e.target.value = "";
    setUploading(false);
    if (result.ok) {
      setSuccess(`"${file.name}" processado. ${result.transactions.length} transação(ões) extraída(s).`);
      setTransactions(result.transactions);
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  async function handleImport(accountId: string) {
    if (!transactions?.length) return;
    setError(null);
    setImporting(true);
    const result = await importExtractedTransactions(accountId, transactions);
    setImporting(false);
    if (result.ok) {
      setSuccess(`${result.inserted} transação(ões) importada(s) para a conta.`);
      setTransactions(null);
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Enviar extrato
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Formatos: <strong>PDF</strong>, <strong>TXT</strong>, <strong>OFX</strong> (máx. {MAX_MB} MB).
            A IA extrai as transações automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            id={inputId}
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            aria-label="Selecionar arquivo de extrato"
            onChange={handleChange}
            disabled={uploading}
          />
          <label
            htmlFor={inputId}
            className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-950/50 p-8 transition-colors hover:border-zinc-600 cursor-pointer"
          >
            {uploading ? (
              <Loader2 className="h-10 w-10 text-emerald-500 mb-4 animate-spin" />
            ) : (
              <Upload className="h-10 w-10 text-zinc-500 mb-4" />
            )}
            <p className="text-zinc-400 text-sm mb-1">
              {uploading ? "Processando com IA…" : "Clique para selecionar ou arraste o arquivo"}
            </p>
            <p className="text-zinc-500 text-xs">
              PDF, TXT ou OFX — até {MAX_MB} MB
            </p>
            <span className="mt-4">
              <Button
                type="button"
                variant="outline"
                className="border-zinc-700 text-zinc-300"
                onClick={(e) => {
                  e.preventDefault();
                  inputRef.current?.click();
                }}
                disabled={uploading}
              >
                {uploading ? "Processando…" : "Selecionar arquivo"}
              </Button>
            </span>
          </label>
          {error && (
            <p className="text-sm text-red-500 bg-red-500/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-emerald-500 bg-emerald-500/10 rounded-md px-3 py-2">
              {success}
            </p>
          )}
        </CardContent>
      </Card>

      {transactions && transactions.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Transações extraídas</CardTitle>
            <CardDescription className="text-zinc-400">
              Revise os dados e importe para uma conta. Categorias são criadas automaticamente se não existirem.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {accounts.length > 0 ? (
              <div className="flex flex-wrap items-center gap-3">
                <label htmlFor="import-account" className="text-sm text-zinc-400">
                  Importar para:
                </label>
                <select
                  id="import-account"
                  className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Selecione a conta
                  </option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} — {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(a.balance))}
                    </option>
                  ))}
                </select>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={importing}
                  onClick={() => {
                    const select = document.getElementById("import-account") as HTMLSelectElement;
                    const accountId = select?.value;
                    if (accountId) handleImport(accountId);
                    else setError("Selecione uma conta.");
                  }}
                >
                  {importing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {importing ? "Importando…" : `Importar ${transactions.length} transações`}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-amber-500">
                Crie uma conta em Contas para poder importar as transações.
              </p>
            )}
            <div className="rounded-lg border border-zinc-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-950/50">
                    <th className="text-left py-3 px-4 text-zinc-400 font-medium">Data</th>
                    <th className="text-left py-3 px-4 text-zinc-400 font-medium">Descrição</th>
                    <th className="text-left py-3 px-4 text-zinc-400 font-medium">Categoria</th>
                    <th className="text-right py-3 px-4 text-zinc-400 font-medium">Valor</th>
                    <th className="text-left py-3 px-4 text-zinc-400 font-medium">Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t, i) => (
                    <tr
                      key={`${t.date}-${t.description}-${t.amount}-${i}`}
                      className="border-b border-zinc-800/80 hover:bg-zinc-800/30"
                    >
                      <td className="py-3 px-4 text-zinc-300">{t.date}</td>
                      <td className="py-3 px-4 text-zinc-200 truncate max-w-[200px]">
                        {t.description}
                      </td>
                      <td className="py-3 px-4 text-zinc-400">{t.category}</td>
                      <td
                        className={`py-3 px-4 text-right font-medium ${
                          t.type === "income" ? "text-emerald-500" : "text-red-500"
                        }`}
                      >
                        {t.type === "income" ? "+" : "-"}{" "}
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(t.amount)}
                      </td>
                      <td className="py-3 px-4 text-zinc-500 capitalize">{t.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
