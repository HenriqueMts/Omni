"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCardPreview, maskLast4 } from "./credit-card-preview";
import { AddCardModal } from "./add-card-modal";
import type { CreditCard } from "@/db/schema";
import { Plus, Trash2, FileUp } from "lucide-react";
import { ImportInvoiceModal } from "./import-invoice-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteCreditCard } from "@/app/actions/credit-cards";
import { useRouter } from "next/navigation";

type Props = { initialCards: CreditCard[] };

export function CardsContent({ initialCards }: Props) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [importCardId, setImportCardId] = useState<string | null>(null);

  async function handleDelete() {
    if (!deleteId) return;
    await deleteCreditCard(deleteId);
    router.refresh();
    setDeleteId(null);
  }

  return (
    <>
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-zinc-100">Seus cartões</CardTitle>
            <CardDescription className="text-zinc-500">
              Cartões cadastrados (apenas últimos 4 dígitos). Importe a fatura para análise com IA.
            </CardDescription>
          </div>
          <Button
            onClick={() => setAddOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar cartão
          </Button>
        </CardHeader>
        <CardContent>
          {initialCards.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-700 bg-zinc-950/50 py-12 text-center">
              <p className="text-zinc-500 mb-4">Nenhum cartão cadastrado.</p>
              <Button
                variant="outline"
                onClick={() => setAddOpen(true)}
                className="border-zinc-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar primeiro cartão
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {initialCards.map((card) => (
                <div
                  key={card.id}
                  className="relative rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 space-y-4"
                >
                  <CreditCardPreview
                    last4={card.last4}
                    holderName={card.holderName}
                    gradientKey={card.gradientKey}
                    className="mx-auto"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-zinc-500 font-mono">
                      {maskLast4(card.last4)}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-zinc-600 text-zinc-400"
                        onClick={() => setImportCardId(card.id)}
                      >
                        <FileUp className="h-4 w-4 mr-1" />
                        Importar fatura
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-zinc-500 hover:text-red-500 hover:bg-red-500/10"
                        onClick={() => setDeleteId(card.id)}
                        aria-label="Excluir cartão"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddCardModal open={addOpen} onOpenChange={setAddOpen} />

      {importCardId && (() => {
        const card = initialCards.find((c) => c.id === importCardId);
        return (
          <ImportInvoiceModal
            open={!!importCardId}
            onOpenChange={(o) => !o && setImportCardId(null)}
            creditCardId={importCardId}
            cardLabel={card ? `•••• ${card.last4}` : "cartão"}
          />
        );
      })()}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="border-zinc-800 bg-zinc-900">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cartão?</AlertDialogTitle>
            <AlertDialogDescription>
              O cartão será removido da lista. Faturas já importadas não serão apagadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-700">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
