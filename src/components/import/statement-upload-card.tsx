"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxCollection,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import { uploadAndProcessStatement, importExtractedTransactions } from "@/app/actions/process-statement";
import type { ExtractedTransaction } from "@/app/actions/process-statement";
import type { Account } from "@/db/schema";
import { getTransactionTypeLabel } from "@/lib/transaction-types";
import { useLocale } from "@/lib/use-locale";
import { FileText, Upload, Loader2, Check } from "lucide-react";

const ACCEPT =
  ".pdf,.txt,.ofx,application/pdf,text/plain,application/x-ofx,text/ofx";
const MAX_MB = 10;

type Props = Readonly<{
  accounts: Account[];
  comboboxContainerRef?: React.RefObject<HTMLDivElement | null>;
}>;

export function StatementUploadCard({ accounts, comboboxContainerRef }: Props) {
  const router = useRouter();
  const locale = useLocale();
  const inputId = "statement-file-input";
  const inputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"upload" | "transactions">("upload");
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [pdfPassword, setPdfPassword] = useState("");
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<ExtractedTransaction[] | null>(null);
  const [closingBalance, setClosingBalance] = useState<number | null>(null);

  const accountItems = accounts.map((a) => ({
    value: a.id,
    label: `${a.name} — ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(a.balance))}`,
  }));
  const selectedAccountItem = accountItems.find((i) => i.value === selectedAccountId) ?? null;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setError(null);
    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Arquivo deve ter no máximo ${MAX_MB} MB.`);
      e.target.value = "";
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    e.target.value = "";
  }

  async function handleEnviar() {
    if (!selectedFile) {
      setError("Selecione um arquivo.");
      return;
    }
    if (!selectedAccountId) {
      setError("Selecione a conta.");
      return;
    }
    if (isPasswordProtected && !pdfPassword.trim()) {
      setError("Informe a senha do arquivo.");
      return;
    }
    setError(null);
    setUploading(true);
    const formData = new FormData();
    formData.set("file", selectedFile);
    if (isPasswordProtected && pdfPassword.trim()) {
      formData.set("pdfPassword", pdfPassword.trim());
    }
    const result = await uploadAndProcessStatement(formData);
    setUploading(false);
    if (result.ok) {
      setTransactions(result.transactions);
      setClosingBalance(result.closingBalance ?? null);
      setStep("transactions");
    } else {
      setError(result.error);
    }
  }

  async function handleConcluir() {
    if (!transactions?.length || !selectedAccountId) return;
    setError(null);
    setImporting(true);
    const result = await importExtractedTransactions(selectedAccountId, transactions, closingBalance);
    setImporting(false);
    if (result.ok) {
      router.refresh();
      setStep("upload");
      setTransactions(null);
      setClosingBalance(null);
      setSelectedFile(null);
      setPdfPassword("");
    } else {
      setError(result.error);
    }
  }

  function handleVoltarTransacoes() {
    setStep("upload");
    setTransactions(null);
    setClosingBalance(null);
  }

  if (step === "transactions" && transactions && transactions.length > 0) {
    return (
      <div className="space-y-6 animate-in fade-in-50 duration-300">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Transações extraídas</CardTitle>
            <CardDescription className="text-zinc-400">
              Revise os dados e clique em Concluir para importar para a conta selecionada.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <p className="text-sm text-red-500 bg-red-500/10 rounded-md px-3 py-2">
                {error}
              </p>
            )}
            <div className="rounded-lg border border-zinc-800 overflow-x-auto overflow-y-visible scrollbar-dark-translucent">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-950/50">
                    <th className="text-left py-3 px-4 text-zinc-400 font-medium whitespace-nowrap">Data</th>
                    <th className="text-left py-3 px-4 text-zinc-400 font-medium">Descrição</th>
                    <th className="text-left py-3 px-4 text-zinc-400 font-medium whitespace-nowrap">Categoria</th>
                    <th className="text-right py-3 px-4 text-zinc-400 font-medium whitespace-nowrap">Valor</th>
                    <th className="text-left py-3 px-4 text-zinc-400 font-medium whitespace-nowrap">Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t, i) => (
                    <tr
                      key={`${t.date}-${t.description}-${t.amount}-${i}`}
                      className="border-b border-zinc-800/80 hover:bg-zinc-800/30"
                    >
                      <td className="py-3 px-4 text-zinc-300 whitespace-nowrap">{t.date}</td>
                      <td className="py-3 px-4 text-zinc-200 min-w-[200px] max-w-[400px] break-words">
                        <span title={t.description}>{t.description}</span>
                      </td>
                      <td className="py-3 px-4 text-zinc-400 whitespace-nowrap">{t.category}</td>
                      <td
                        className={`py-3 px-4 text-right font-medium whitespace-nowrap ${
                          t.type === "income" ? "text-emerald-500" : "text-red-500"
                        }`}
                      >
                        {t.type === "income" ? "+" : "-"}{" "}
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(t.amount)}
                      </td>
                      <td className="py-3 px-4 text-zinc-500 whitespace-nowrap">{getTransactionTypeLabel(t.type, locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleVoltarTransacoes}
                className="border-zinc-700 text-zinc-300"
              >
                Voltar
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-emerald-400/80 shadow-md shadow-emerald-900/40 hover:border-emerald-300 focus-visible:ring-emerald-400/50"
                disabled={importing}
                onClick={handleConcluir}
              >
                {importing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {importing ? "Importando…" : "Concluir"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Importar extrato
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Selecione a conta, envie o arquivo e a IA extrai as transações automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-zinc-300">Conta a qual o extrato pertence</Label>
            <div className="min-w-[220px]">
              <Combobox
                items={accountItems}
                value={selectedAccountItem}
                onValueChange={(v) => setSelectedAccountId(v?.value ?? null)}
                itemToStringValue={(item) => item.label}
              >
                <ComboboxInput
                  showTrigger
                  showClear={!!selectedAccountId}
                  disabled={uploading}
                  placeholder="Selecione a conta"
                  className="border-zinc-700 bg-zinc-950 text-zinc-200 placeholder:text-zinc-500"
                />
                <ComboboxContent container={comboboxContainerRef} className="border-zinc-800 bg-zinc-900">
                  <ComboboxList className="scrollbar-dark-translucent">
                    <ComboboxEmpty>Nenhuma conta encontrada</ComboboxEmpty>
                    <ComboboxCollection>
                      {(item) => (
                        <ComboboxItem
                          key={item.value}
                          value={item}
                          className="text-zinc-200 data-highlighted:bg-zinc-800 data-highlighted:text-zinc-100"
                        >
                          {item.label}
                        </ComboboxItem>
                      )}
                    </ComboboxCollection>
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Arquivo do extrato</Label>
            <input
              id={inputId}
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              aria-label="Selecionar arquivo"
              onChange={handleFileChange}
              disabled={uploading}
            />
            <label
              htmlFor={inputId}
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-950/50 p-8 transition-colors hover:border-zinc-600 cursor-pointer"
            >
              {selectedFile ? (
                <p className="text-zinc-300 text-sm">{selectedFile.name}</p>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-zinc-500 mb-2" />
                  <p className="text-zinc-400 text-sm">Clique para selecionar ou arraste o arquivo</p>
                  <p className="text-zinc-500 text-xs mt-1">PDF, TXT ou OFX — até {MAX_MB} MB</p>
                </>
              )}
            </label>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="pdf-protected"
              checked={isPasswordProtected}
              onCheckedChange={setIsPasswordProtected}
              disabled={uploading}
              className="border-2 border-zinc-500/70 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-400/90 data-[state=unchecked]:bg-zinc-700 data-[state=unchecked]:border-zinc-500/70 [&_[data-slot=switch-thumb]]:!bg-white [&_[data-slot=switch-thumb]]:shadow-md [&_[data-slot=switch-thumb]]:shadow-black/30"
            />
            <Label htmlFor="pdf-protected" className="text-sm text-zinc-400 cursor-pointer">
              O arquivo é protegido por senha?
            </Label>
          </div>
          {isPasswordProtected && (
            <div className="space-y-2">
              <Label htmlFor="pdf-password" className="text-zinc-300">Senha do PDF</Label>
              <Input
                id="pdf-password"
                type="password"
                placeholder="Digite a senha"
                value={pdfPassword}
                onChange={(e) => setPdfPassword(e.target.value)}
                disabled={uploading}
                autoComplete="off"
                className="border-zinc-700 bg-zinc-950 text-zinc-200 placeholder:text-zinc-500"
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500 bg-red-500/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-emerald-400/80 shadow-md shadow-emerald-900/40 hover:border-emerald-300 focus-visible:ring-emerald-400/50 w-full sm:w-auto"
            disabled={uploading || !selectedFile || !selectedAccountId}
            onClick={handleEnviar}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {uploading ? "Processando com IA…" : "Enviar"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
