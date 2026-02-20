"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { getReportAIAnalysis } from "@/app/actions/reports-ai";
import type { ReportsData } from "@/services/reports";

export function ReportsAIAnalysis({ data }: { data: ReportsData }) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    const result = await getReportAIAnalysis(data);
    setLoading(false);
    if (result.ok) setAnalysis(result.analysis);
    else setError(result.error);
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-zinc-100 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-500" />
          Análise da IA
        </CardTitle>
        <p className="text-sm text-zinc-500">
          Insights com base nos dados do relatório
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!analysis && !loading && (
          <Button
            type="button"
            onClick={handleGenerate}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            <Sparkles className="h-4 w-4" />
            Gerar análise com IA
          </Button>
        )}
        {loading && (
          <div className="flex items-center gap-2 text-zinc-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Analisando seus dados...</span>
          </div>
        )}
        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 rounded-md px-3 py-2">
            {error}
          </p>
        )}
        {analysis && (
          <div className="rounded-lg bg-zinc-950/50 border border-zinc-800 p-4">
            <p className="text-sm text-zinc-300 whitespace-pre-line leading-relaxed">
              {analysis}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-3 text-zinc-500 hover:text-zinc-300"
              onClick={handleGenerate}
            >
              Gerar novamente
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
