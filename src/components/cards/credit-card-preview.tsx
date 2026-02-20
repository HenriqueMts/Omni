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
      <div className="absolute top-3 left-3 sm:top-4 sm:left-5 w-9 h-6 sm:w-11 sm:h-8 rounded-[5px] sm:rounded-[6px] bg-gradient-to-br from-zinc-400 to-zinc-500 border border-zinc-600/80 shadow-inner" />
      {/* Número mascarado — dentro do cartão, sem sobrepor */}
      <div
        className={cn(
          "absolute left-3 right-3 sm:left-5 sm:right-5 font-mono tracking-[0.15em] sm:tracking-[0.2em] truncate",
          "text-sm sm:text-lg md:text-xl leading-tight",
          "bottom-10 sm:bottom-14",
          isLight ? "text-zinc-800/90" : "text-white/95",
        )}
      >
        {maskLast4(last4)}
      </div>
      {/* Nome — fixo na base, uma linha, sem sobrepor o número */}
      <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-5 sm:right-5">
        <span
          className={cn(
            "text-xs sm:text-sm md:text-base uppercase tracking-wider truncate block max-w-full",
            isLight ? "text-zinc-800/90 font-medium" : "text-white/90",
          )}
        >
          {holderName || "NOME DO TITULAR"}
        </span>
      </div>
    </div>
  );
}
