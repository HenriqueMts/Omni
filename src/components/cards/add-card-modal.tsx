"use client";

import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createCreditCard } from "@/app/actions/credit-cards";
import { CreditCardPreview, CARD_GRADIENTS } from "./credit-card-preview";
import { cn } from "@/lib/utils";

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

export function AddCardModal({ open, onOpenChange }: Props) {
  const router = useRouter();
  const [last4, setLast4] = useState("");
  const [holderName, setHolderName] = useState("");
  const [gradientKey, setGradientKey] = useState("holographic");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLast4("");
      setHolderName("");
      setGradientKey("holographic");
      setError(null);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("last4", last4.replaceAll(/\D/g, "").slice(-4));
    formData.set("holderName", holderName);
    formData.set("expiryMonth", "01");
    formData.set("expiryYear", "30");
    formData.set("gradientKey", gradientKey);
    const result = await createCreditCard(formData);
    setLoading(false);
    if (result.ok) {
      router.refresh();
      onOpenChange(false);
    } else {
      setError(result.error ?? "Erro ao cadastrar");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-zinc-800 bg-zinc-900 text-zinc-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar cartão de crédito</DialogTitle>
          <DialogDescription className="text-zinc-500">
            Informe apenas os 4 últimos dígitos para identificar o cartão. Os dados completos não são armazenados.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Preview do cartão */}
          <div className="flex justify-center">
            <CreditCardPreview
              last4={last4}
              holderName={holderName}
              gradientKey={gradientKey}
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-zinc-300 text-center sm:text-left">
              Cor do cartão
            </p>
            <RadioGroup
              value={gradientKey}
              onValueChange={setGradientKey}
              className="flex flex-wrap justify-center gap-3 sm:justify-start"
            >
            {Object.entries(CARD_GRADIENTS).map(([key, { className }]) => (
              <RadioGroupItem
                key={key}
                value={key}
                id={`gradient-${key}`}
                className={cn(
                  "size-10 rounded-full border-2 border-transparent bg-gradient-to-br shadow-md transition-all cursor-pointer hover:scale-110 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 data-[state=checked]:border-white data-[state=checked]:ring-2 data-[state=checked]:ring-white/50 [&_[data-slot=radio-group-indicator]]:hidden",
                  className
                )}
              />
            ))}
            </RadioGroup>
          </div>

          <input type="hidden" name="gradientKey" value={gradientKey} />
          <input type="hidden" name="holderName" value={holderName} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="last4" className="text-zinc-400">
                4 últimos dígitos
              </Label>
              <Input
                id="last4"
                inputMode="numeric"
                maxLength={4}
                placeholder="1234"
                value={last4.replaceAll(/\D/g, "").slice(-4)}
                onChange={(e) => setLast4(e.target.value.replaceAll(/\D/g, "").slice(-4))}
                className="bg-zinc-800 border-zinc-700 font-mono tracking-widest"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="holderName" className="text-zinc-400">
                Nome no cartão
              </Label>
              <Input
                id="holderName"
                name="holderName"
                placeholder="NOME COMO NO CARTÃO"
                value={holderName}
                onChange={(e) => setHolderName(e.target.value.toUpperCase().slice(0, 100))}
                className="bg-zinc-800 border-zinc-700 uppercase"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-500/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <DialogFooter className="gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-zinc-700"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                loading ||
                last4.replaceAll(/\D/g, "").length !== 4 ||
                !holderName.trim()
              }
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? "Salvando…" : "Adicionar cartão"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
