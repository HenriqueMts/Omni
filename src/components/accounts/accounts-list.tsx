"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { AccountCreateModal } from "./account-create-modal";
import { AccountEditModal } from "./account-edit-modal";
import { deleteAccount } from "@/app/actions/accounts";
import type { Account } from "@/db/schema";
import { Pencil, Plus, Trash2, Wallet } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  checking: "Conta bancária",
  savings: "Poupança",
  credit_card: "Cartão de crédito",
  investment: "Conta de investimento",
  cash: "Dinheiro",
};

export function AccountsList({ accounts }: Readonly<{ accounts: Account[] }>) {
  const router = useRouter();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    const result = await deleteAccount(id);
    setDeletingId(null);
    setDeletingAccount(null);
    if (result.ok) router.refresh();
    else alert(result.error);
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in-up animate-opacity-0">
        <p className="text-sm text-zinc-500">Dashboard &gt; Contas</p>
        {accounts.length > 0 && (
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => setCreateModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova conta
          </Button>
        )}
      </div>

      <div className="animate-fade-in-up animate-opacity-0 animate-delay-1">
        <h2 className="text-2xl font-bold text-zinc-100">Contas</h2>
        <p className="text-zinc-500 mt-0.5">
          Suas contas bancárias, cartões e carteiras
        </p>
      </div>

      <Card className="bg-zinc-900 border-zinc-800 animate-fade-in-up animate-opacity-0 animate-delay-2">
        <CardHeader>
          <CardTitle className="text-zinc-100">Minhas contas</CardTitle>
          <CardDescription className="text-zinc-400">
            Gerencie saldos e tipos de cada conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {accounts.length === 0 ? (
              <Empty className="border-zinc-800 py-12">
                <EmptyHeader>
                  <EmptyMedia variant="icon" className="bg-zinc-800 text-zinc-400">
                    <Wallet className="size-6" />
                  </EmptyMedia>
                  <EmptyTitle className="text-zinc-200">
                    Nenhuma conta cadastrada
                  </EmptyTitle>
                  <EmptyDescription className="text-zinc-500">
                    Cadastre sua primeira conta para começar a organizar suas finanças.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => setCreateModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova conta
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
              accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/50 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="rounded-full p-2 bg-zinc-800">
                      <Wallet className="h-5 w-5 text-zinc-400" />
                    </div>
                    <div>
                      <p className="font-medium text-zinc-200">{acc.name}</p>
                      <p className="text-sm text-zinc-500">
                        {TYPE_LABELS[acc.type] ?? acc.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-100">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(Number(acc.balance))}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-zinc-400 hover:text-emerald-500"
                      onClick={() => {
                        setEditingAccount(acc);
                        setEditModalOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-zinc-400 hover:text-red-500"
                      onClick={() => setDeletingAccount(acc)}
                      disabled={deletingId === acc.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <AccountCreateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />
      <AccountEditModal
        account={editingAccount}
        open={editModalOpen}
        onOpenChange={(open) => {
          setEditModalOpen(open);
          if (!open) setEditingAccount(null);
        }}
      />
      <AlertDialog open={!!deletingAccount} onOpenChange={(open) => !open && setDeletingAccount(null)}>
        <AlertDialogContent className="border-zinc-800 bg-zinc-900 text-zinc-50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">
              Excluir conta
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Excluir esta conta? Transações vinculadas podem ser afetadas.
              {deletingAccount && (
                <span className="block mt-2 font-medium text-zinc-200">
                  {deletingAccount.name}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 sm:gap-4">
            <AlertDialogCancel className="border-zinc-700 text-zinc-300">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => deletingAccount && handleDelete(deletingAccount.id)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
