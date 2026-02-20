"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { processCreditCardInvoice } from "@/app/actions/process-credit-card-invoice";
import { Upload, Loader2, FileText } from "lucide-react";

type Props = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creditCardId: string;
  cardLabel: string;
}>;

export function ImportInvoiceModal({
  open,
  onOpenChange,
  creditCardId,
  cardLabel,
}: Props) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    totalAmount: string;
    periodEnd: string;
    suggestions: string | null;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setFile(null);
    setError(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) {
      setError("Selecione um arquivo da fatura (PDF, CSV ou OFX).");
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);
    const formData = new FormData();
    formData.set("file", file);
    const res = await processCreditCardInvoice(creditCardId, formData);
    setLoading(false);
    if (res.ok) {
      setResult({
        totalAmount: res.totalAmount,
        periodEnd: res.periodEnd,
        suggestions: res.aiSuggestions,
      });
      router.refresh();
    } else {
      setError(res.error ?? "Erro ao processar fatura");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="border-zinc-800 bg-zinc-900 text-zinc-100 max-w-md">
        <DialogHeader>
          <DialogTitle>Importar fatura</DialogTitle>
          <DialogDescription className="text-zinc-500">
            Cartão {cardLabel}. Envie o PDF, CSV ou OFX da fatura para extrair totais e lançamentos com IA.
          </DialogDescription>
        </DialogHeader>
        {result ? (
          <div className="space-y-3 py-2">
            <p className="text-sm text-emerald-400 font-medium">Fatura importada com sucesso.</p>
            <p className="text-sm text-zinc-400">
              Total: R$ {Number(result.totalAmount).toFixed(2)} — Fechamento: {result.periodEnd}
            </p>
            {result.suggestions && (
              <div className="rounded-lg border border-zinc-700 bg-zinc-950/50 p-3">
                <p className="text-xs font-medium text-zinc-500 mb-1">Sugestões da IA</p>
                <p className="text-sm text-zinc-300 whitespace-pre-wrap">{result.suggestions}</p>
              </div>
            )}
            <DialogFooter className="pt-2">
              <Button onClick={() => handleOpenChange(false)} className="bg-zinc-700 hover:bg-zinc-600">
                Fechar
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="invoice-pdf-upload" className="text-sm font-medium text-zinc-300 block mb-2">
                Arquivo da fatura (PDF, CSV ou OFX)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="invoice-pdf-upload"
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.csv,.ofx,application/pdf,text/csv,application/csv,application/x-ofx,text/x-ofx"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-zinc-600"
                  onClick={() => inputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {file ? file.name : "Selecionar arquivo"}
                </Button>
                {file && (
                  <span className="text-xs text-zinc-500 truncate max-w-[140px]" title={file.name}>
                    <FileText className="h-3 w-3 inline mr-1" />
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                )}
              </div>
            </div>
            {error && (
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className="border-zinc-600"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!file || loading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando…
                  </>
                ) : (
                  "Importar"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
