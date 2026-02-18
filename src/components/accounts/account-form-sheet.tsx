"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { createAccount, updateAccount } from "@/app/actions/accounts";
import type { Account } from "@/db/schema";
import { Plus } from "lucide-react";

const ACCOUNT_TYPES = [
  { value: "checking", label: "Conta corrente" },
  { value: "savings", label: "Poupança" },
  { value: "credit_card", label: "Cartão de crédito" },
  { value: "investment", label: "Investimento" },
  { value: "cash", label: "Dinheiro" },
] as const;

type Props = Readonly<{
  account?: Account | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}>;

export function AccountFormSheet({ account, open: controlledOpen, onOpenChange }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!account;
  const isControlled = controlledOpen !== undefined;

  const effectiveOpen = isControlled ? controlledOpen : open;
  const setEffectiveOpen = isControlled ? (onOpenChange ?? (() => {})) : setOpen;

  async function handleSubmit(formData: FormData) {
    setError(null);
    const result = isEdit
      ? await updateAccount(account.id, formData)
      : await createAccount(formData);
    if (result.ok) {
      setEffectiveOpen(false);
      router.refresh();
    } else {
      setError(result.error ?? "Erro");
    }
  }

  return (
    <Sheet open={effectiveOpen} onOpenChange={setEffectiveOpen}>
      {!isControlled && (
        <SheetTrigger asChild>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="h-4 w-4" />
            Nova conta
          </Button>
        </SheetTrigger>
      )}
      <SheetContent side="right" className="bg-zinc-900 border-zinc-800">
        <SheetHeader>
          <SheetTitle className="text-zinc-100">
            {isEdit ? "Editar conta" : "Nova conta"}
          </SheetTitle>
        </SheetHeader>
        <form key={account?.id ?? "new"} action={handleSubmit} className="flex flex-col gap-4 mt-6">
          {error && (
            <p className="text-sm text-red-500 bg-red-500/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-zinc-300">
              Nome
            </Label>
            <Input
              id="name"
              name="name"
              defaultValue={account?.name}
              placeholder="Ex: Nubank, Carteira"
              required
              className="bg-zinc-950 border-zinc-700 text-zinc-100"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type" className="text-zinc-300">
              Tipo
            </Label>
            <select
              id="type"
              name="type"
              defaultValue={account?.type ?? "checking"}
              required
              className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-1 text-sm text-zinc-100 shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
            >
              {ACCOUNT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="balance" className="text-zinc-300">
              Saldo inicial
            </Label>
            <Input
              id="balance"
              name="balance"
              type="number"
              step="0.01"
              defaultValue={account?.balance ?? "0"}
              placeholder="0,00"
              className="bg-zinc-950 border-zinc-700 text-zinc-100"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="color" className="text-zinc-300">
              Cor (hex)
            </Label>
            <Input
              id="color"
              name="color"
              type="text"
              defaultValue={account?.color ?? "#000000"}
              placeholder="#000000"
              className="bg-zinc-950 border-zinc-700 text-zinc-100"
            />
          </div>
          <SheetFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEffectiveOpen(false)}
              className="border-zinc-700 text-zinc-300"
            >
              Cancelar
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {isEdit ? "Salvar" : "Criar conta"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
