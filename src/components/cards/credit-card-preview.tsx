"use client";

import { cn } from "@/lib/utils";

export const CARD_GRADIENTS: Record<string, { className: string }> = {
  holographic: {
    className: "from-sky-300 via-violet-200 to-amber-100",
  },
  orange_red: { className: "from-orange-500 via-orange-600 to-red-600" },
  green: { className: "from-emerald-600 via-green-600 to-teal-700" },
  gray_orange: { className: "from-zinc-600 via-zinc-500 to-orange-600" },
  blue: { className: "from-blue-600 via-indigo-600 to-violet-700" },
  purple: { className: "from-violet-600 via-purple-600 to-fuchsia-600" },
};

/** Máscara: exibe **** **** **** XXXX a partir dos últimos 4 dígitos */
export function maskLast4(last4: string): string {
  const digits = last4.replaceAll(/\D/g, "").slice(-4);
  if (digits.length === 0) return "**** **** **** ****";
  return `**** **** **** ${digits}`;
}

type Props = {
  last4: string;
  holderName: string;
  gradientKey: string;
  className?: string;
};

export function CreditCardPreview({
  last4,
  holderName,
  gradientKey,
  className,
}: Props) {
  const gradient = CARD_GRADIENTS[gradientKey] ?? CARD_GRADIENTS.orange_red;
  const isLight = gradientKey === "holographic";

  return (
    <div
      className={cn(
        "relative w-full min-w-[280px] max-w-[340px] aspect-[1.586/1] rounded-2xl overflow-hidden bg-gradient-to-br shadow-xl",
        "border-2 border-white/30 border-b-white/20",
        gradient.className,
        className,
      )}
    >
      {/* Chip EMV (metálico) */}
      <div className="absolute top-14 left-5 w-11 h-8 rounded-[6px] bg-gradient-to-br from-zinc-400 to-zinc-500 border border-zinc-600/80 shadow-inner" />
      {/* Número mascarado */}
      <div
        className={cn(
          "absolute bottom-14 left-5 right-5 font-mono text-lg sm:text-xl tracking-[0.2em]",
          isLight ? "text-zinc-800/90" : "text-white/95",
        )}
      >
        {maskLast4(last4)}
      </div>
      {/* Nome */}
      <div className="absolute bottom-4 left-5 right-5">
        <span
          className={cn(
            "text-sm sm:text-base uppercase tracking-wider truncate block",
            isLight ? "text-zinc-800/90 font-medium" : "text-white/90",
          )}
        >
          {holderName || "NOME DO TITULAR"}
        </span>
      </div>
    </div>
  );
}
