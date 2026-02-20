"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { createAccount } from "@/app/actions/accounts";
import { Landmark, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

type AccountKind = "checking" | "investment";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AccountCreateModal({ open, onOpenChange }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [kind, setKind] = useState<AccountKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleClose() {
    setStep(1);
    setKind(null);
    setError(null);
    onOpenChange(false);
  }

  function handleKindSelect(value: AccountKind) {
    setKind(value);
    setError(null);
  }

  function handleContinue() {
    if (!kind) {
      setError("Selecione uma opção");
      return;
    }
    setStep(2);
    setError(null);
  }

  function handleBack() {
    setStep(1);
    setKind(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("type", kind!);
    const result = await createAccount(formData);
    setLoading(false);
    if (result.ok) {
      router.refresh();
      handleClose();
    } else {
      setError(result.error ?? "Erro ao criar");
    }
  }

  const isAccount = kind === "checking";
  const isInvestment = kind === "investment";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        className={cn(
          "border-zinc-800 bg-zinc-900 text-zinc-50 transition-all duration-300",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        )}
      >
        <DialogHeader>
          <DialogTitle>
            {step === 1
            ? "O que deseja cadastrar?"
            : isAccount
              ? "Nova conta bancária"
              : "Nova conta de investimento"}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {step === 1
              ? "Escolha o tipo para continuar"
              : isAccount
                ? "Adicione os dados da conta bancária"
                : "Adicione os dados da conta de investimento"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="grid gap-3 py-2" key="step1">
            <Card
              className={cn(
                "cursor-pointer transition-all duration-200 border-2",
                kind === "checking"
                  ? "border-emerald-500/60 bg-emerald-500/5"
                  : "border-zinc-800 hover:border-zinc-700 bg-zinc-950/50"
              )}
              onClick={() => handleKindSelect("checking")}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <Checkbox
                  checked={kind === "checking"}
                  onCheckedChange={() => handleKindSelect("checking")}
                  onClick={(e) => e.stopPropagation()}
                  className="border-zinc-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                />
                <Landmark className="h-5 w-5 text-zinc-400 shrink-0" />
                <span className="font-medium">Conta bancária</span>
              </CardContent>
            </Card>
            <Card
              className={cn(
                "cursor-pointer transition-all duration-200 border-2",
                kind === "investment"
                  ? "border-emerald-500/60 bg-emerald-500/5"
                  : "border-zinc-800 hover:border-zinc-700 bg-zinc-950/50"
              )}
              onClick={() => handleKindSelect("investment")}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <Checkbox
                  checked={kind === "investment"}
                  onCheckedChange={() => handleKindSelect("investment")}
                  onClick={(e) => e.stopPropagation()}
                  className="border-zinc-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                />
                <TrendingUp className="h-5 w-5 text-zinc-400 shrink-0" />
                <span className="font-medium">Conta de investimento</span>
              </CardContent>
            </Card>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
        ) : (
          <form
            id="account-create-form"
            onSubmit={handleSubmit}
            className="space-y-4 py-2"
            key="step2"
          >
            <input type="hidden" name="type" value={kind!} />
            <input type="hidden" name="color" value="#3f3f46" />
            <div className="space-y-2 animate-in fade-in-50 slide-in-from-bottom-2 duration-200">
              <Label htmlFor="name" className="text-zinc-300">
                Nome da conta
              </Label>
              <Input
                id="name"
                name="name"
                placeholder={
                  isAccount
                    ? "Ex: Nubank, Banco do Brasil"
                    : "Ex: XP, Nuinvest"
                }
                required
                className="bg-zinc-950 border-zinc-700 text-zinc-100"
                autoFocus
              />
            </div>
            <div className="space-y-2 animate-in fade-in-50 slide-in-from-bottom-2 duration-200 [animation-delay:50ms]">
              <Label htmlFor="balance" className="text-zinc-300">
                Saldo inicial
              </Label>
              <Input
                id="balance"
                name="balance"
                type="number"
                step="0.01"
                defaultValue="0"
                placeholder="0,00"
                className="bg-zinc-950 border-zinc-700 text-zinc-100"
              />
            </div>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </form>
        )}

        <DialogFooter className="gap-3 sm:gap-4">
          {step === 1 ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="border-zinc-700"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleContinue}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Continuar
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="border-zinc-700"
              >
                Voltar
              </Button>
              <Button
                type="submit"
                form="account-create-form"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? "Adicionando…" : "Adicionar"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
