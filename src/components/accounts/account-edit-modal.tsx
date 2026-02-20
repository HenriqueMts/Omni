"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxCollection,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import { updateAccount } from "@/app/actions/accounts";
import type { Account } from "@/db/schema";
import { cn } from "@/lib/utils";

const ACCOUNT_TYPES: { value: string; label: string }[] = [
  { value: "checking", label: "Conta bancária" },
  { value: "investment", label: "Conta de investimento" },
  { value: "credit_card", label: "Cartão de crédito" },
];

type Props = Readonly<{
  account: Account | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>;

export function AccountEditModal({ account, open, onOpenChange }: Props) {
  const router = useRouter();
  const modalContentRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<string>("checking");

  useEffect(() => {
    if (open && account) {
      const type = account.type;
      setAccountType(
        ["checking", "investment", "credit_card"].includes(type)
          ? type
          : "checking"
      );
    }
  }, [open, account?.type]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!account) return;
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await updateAccount(account.id, formData);
    if (result.ok) {
      onOpenChange(false);
      router.refresh();
    } else {
      setError(result.error ?? "Erro");
    }
  }

  if (!account) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "border-zinc-800 bg-zinc-900 text-zinc-50",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-zinc-100">Editar conta</DialogTitle>
        </DialogHeader>
        <form
          ref={modalContentRef}
          key={account.id}
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          {account.color && (
            <input type="hidden" name="color" value={account.color} />
          )}
          <input type="hidden" name="type" value={accountType} />
          {error && (
            <p className="text-sm text-red-500 bg-red-500/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="edit-name" className="text-zinc-300">
              Nome
            </Label>
            <Input
              id="edit-name"
              name="name"
              defaultValue={account.name}
              placeholder="Ex: Nubank, Carteira"
              required
              className="bg-zinc-950 border-zinc-700 text-zinc-100"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-type" className="text-zinc-300">
              Tipo
            </Label>
            <Combobox
              items={ACCOUNT_TYPES}
              value={ACCOUNT_TYPES.find((t) => t.value === accountType) ?? ACCOUNT_TYPES[0]}
              onValueChange={(v) => v != null && setAccountType(v.value)}
              itemToStringValue={(item) => item.label}
            >
              <ComboboxInput
                showTrigger
                showClear={false}
                placeholder="Selecione o tipo"
                className="w-full border-zinc-700 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500"
              />
              <ComboboxContent container={modalContentRef} className="border-zinc-800 bg-zinc-900">
                <ComboboxList className="scrollbar-dark-translucent">
                  <ComboboxEmpty>Nenhum tipo encontrado</ComboboxEmpty>
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
          <div className="space-y-2">
            <Label htmlFor="edit-balance" className="text-zinc-300">
              Saldo
            </Label>
            <Input
              id="edit-balance"
              name="balance"
              type="number"
              step="0.01"
              defaultValue={account.balance ?? "0"}
              placeholder="0,00"
              className="bg-zinc-950 border-zinc-700 text-zinc-100"
            />
          </div>
          <DialogFooter className="gap-3 sm:gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-zinc-700 text-zinc-300"
            >
              Cancelar
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
