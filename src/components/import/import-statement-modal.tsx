"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { StatementUploadForm } from "./statement-upload-form";
import { StatementTransactionsModal } from "./statement-transactions-modal";
import { useImportStatement } from "@/contexts/import-statement-context";
import type { Account } from "@/db/schema";
import type { ExtractedTransaction } from "@/app/actions/process-statement";
import { Wallet } from "lucide-react";

type TransactionsData = {
  transactions: ExtractedTransaction[];
  closingBalance: number | null;
  selectedAccountId: string;
};

type Props = Readonly<{ accounts: Account[] }>;

export function ImportStatementModal({ accounts }: Props) {
  const router = useRouter();
  const { open, setOpen } = useImportStatement();
  const modalContentRef = useRef<HTMLDivElement>(null);
  const [transactionsModalOpen, setTransactionsModalOpen] = useState(false);
  const [transactionsData, setTransactionsData] = useState<TransactionsData | null>(null);
  const hasAccounts = accounts.length > 0;

  function handleEnviarSuccess(data: TransactionsData) {
    setOpen(false);
    setTransactionsData(data);
    setTransactionsModalOpen(true);
  }

  function handleConcluir() {
    setTransactionsModalOpen(false);
    setOpen(false);
    setTransactionsData(null);
    router.refresh();
  }

  function handleVoltar() {
    setTransactionsModalOpen(false);
    setOpen(true);
    setTransactionsData(null);
  }

  return (
    <>
      {/* Modal pequeno: conta, arquivo, senha */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[90vw] max-w-[40vw] max-h-[min(420px,85vh)] flex flex-col overflow-hidden border-zinc-800 bg-zinc-900 text-zinc-50 p-0 gap-0 [&>button]:top-4 [&>button]:right-4 [&>button]:z-10">
          <DialogHeader className="shrink-0 border-b border-zinc-800 px-6 py-3 text-left">
            <DialogTitle className="text-zinc-100">Importar extrato</DialogTitle>
            <DialogDescription className="text-zinc-400 text-sm">
              {hasAccounts
                ? "Selecione a conta, o arquivo e envie."
                : "Cadastre uma conta para poder importar extratos."}
            </DialogDescription>
          </DialogHeader>
          <div ref={modalContentRef} className="flex-1 min-h-0 overflow-y-auto px-6 py-4 scrollbar-dark-translucent">
            {hasAccounts ? (
              <StatementUploadForm
                accounts={accounts}
                comboboxContainerRef={modalContentRef}
                onEnviarSuccess={handleEnviarSuccess}
              />
            ) : (
              <Empty className="border-zinc-800 border-dashed py-6">
                <EmptyHeader>
                  <EmptyMedia variant="icon" className="bg-amber-500/10 text-amber-500">
                    <Wallet className="size-6" />
                  </EmptyMedia>
                  <EmptyTitle className="text-zinc-200">
                    Nenhuma conta cadastrada
                  </EmptyTitle>
                  <EmptyDescription className="text-zinc-500">
                    Cadastre pelo menos uma conta para poder importar extratos.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                    <Link href="/dashboard/accounts" onClick={() => setOpen(false)}>
                      Cadastrar conta
                    </Link>
                  </Button>
                </EmptyContent>
              </Empty>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal grande: transações extraídas */}
      <StatementTransactionsModal
        open={transactionsModalOpen}
        onOpenChange={setTransactionsModalOpen}
        transactionsData={transactionsData}
        onConcluir={handleConcluir}
        onVoltar={handleVoltar}
      />
    </>
  );
}
