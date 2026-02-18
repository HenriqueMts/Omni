"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { importExtractedTransactions } from "@/app/actions/process-statement";
import type { ExtractedTransaction } from "@/app/actions/process-statement";
import { getTransactionTypeLabel } from "@/lib/transaction-types";
import { useLocale } from "@/lib/use-locale";
import { Loader2, Check } from "lucide-react";

type TransactionsData = {
  transactions: ExtractedTransaction[];
  closingBalance: number | null;
  selectedAccountId: string;
};

type Props = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionsData: TransactionsData | null;
  onConcluir: () => void;
  onVoltar: () => void;
}>;

export function StatementTransactionsModal({
  open,
  onOpenChange,
  transactionsData,
  onConcluir,
  onVoltar,
}: Props) {
  const locale = useLocale();
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConcluir() {
    if (!transactionsData?.transactions?.length || !transactionsData.selectedAccountId) return;
    setError(null);
    setImporting(true);
    const result = await importExtractedTransactions(
      transactionsData.selectedAccountId,
      transactionsData.transactions,
      transactionsData.closingBalance,
    );
    setImporting(false);
    if (result.ok) {
      onConcluir();
    } else {
      setError(result.error);
    }
  }

  function handleVoltar() {
    setError(null);
    onVoltar();
  }

  const transactions = transactionsData?.transactions ?? [];
  const hasTransactions = transactions.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[95vw] !max-w-[95vw] sm:!max-w-[95vw] h-[95vh] max-h-[95vh] flex flex-col overflow-hidden border-zinc-800 bg-zinc-900 text-zinc-50 p-0 gap-0 [&>button]:top-4 [&>button]:right-4 [&>button]:z-10">
        <DialogHeader className="shrink-0 border-b border-zinc-800 px-6 py-4 text-left">
          <DialogTitle className="text-zinc-100">Transações extraídas</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Revise os dados e clique em Concluir para importar para a conta selecionada.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 scrollbar-dark-translucent">
          {hasTransactions ? (
            <div className="space-y-4">
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
                        <td className="py-3 px-4 text-zinc-500 whitespace-nowrap">
                          {getTransactionTypeLabel(t.type, locale)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleVoltar}
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
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
