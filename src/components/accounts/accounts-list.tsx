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
import { AccountFormSheet } from "./account-form-sheet";
import { deleteAccount } from "@/app/actions/accounts";
import type { Account } from "@/db/schema";
import { Pencil, Trash2, Wallet } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  checking: "Conta corrente",
  savings: "Poupança",
  credit_card: "Cartão de crédito",
  investment: "Investimento",
  cash: "Dinheiro",
};

export function AccountsList({ accounts }: Readonly<{ accounts: Account[] }>) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta conta? Transações vinculadas podem ser afetadas.")) return;
    setDeletingId(id);
    const result = await deleteAccount(id);
    setDeletingId(null);
    if (result.ok) router.refresh();
    else alert(result.error);
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-500">Dashboard &gt; Contas</p>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => {
            setEditingAccount(null);
            setSheetOpen(true);
          }}
        >
          Nova conta
        </Button>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-zinc-100">Contas</h2>
        <p className="text-zinc-500 mt-0.5">
          Suas contas bancárias, cartões e carteiras
        </p>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Minhas contas</CardTitle>
          <CardDescription className="text-zinc-400">
            Gerencie saldos e tipos de cada conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {accounts.length === 0 ? (
              <p className="text-zinc-500 py-8 text-center">
                Nenhuma conta cadastrada. Clique em &quot;Nova conta&quot; para começar.
              </p>
            ) : (
              accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/50 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="rounded-full p-2"
                      style={{ backgroundColor: `${acc.color ?? "#000"}20` }}
                    >
                      <Wallet
                        className="h-5 w-5"
                        style={{ color: acc.color ?? "#000" }}
                      />
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
                        setSheetOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-zinc-400 hover:text-red-500"
                      onClick={() => handleDelete(acc.id)}
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

      <AccountFormSheet
        account={editingAccount}
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setEditingAccount(null);
        }}
      />
    </>
  );
}
