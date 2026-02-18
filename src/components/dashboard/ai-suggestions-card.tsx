"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export function AISuggestionsCard() {
  return (
    <Card className="bg-zinc-900 border-zinc-800 overflow-hidden animate-fade-in-up animate-opacity-0 animate-delay-8">
      <CardHeader className="pb-2">
        <CardTitle className="text-zinc-100 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-500" />
          Sugestões de IA
        </CardTitle>
        <p className="text-sm text-zinc-500">
          Análise e recomendações personalizadas (em breve)
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-950/50 border border-zinc-800/80">
            <div className="rounded-full bg-emerald-500/10 p-1.5 shrink-0">
              <Sparkles className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-zinc-300">
                Importe extratos e acompanhe suas finanças para receber sugestões inteligentes sobre gastos, economia e metas.
              </p>
            </div>
          </div>
          <p className="text-xs text-zinc-500">
            Conecte suas contas e transações para desbloquear análises com IA.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
