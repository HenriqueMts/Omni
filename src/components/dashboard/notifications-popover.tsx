"use client";

import { useState } from "react";
import { Bell, AlertTriangle, CheckCircle, Info, Loader2, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getFinancialInsights, type FinancialInsight } from "@/app/actions/notifications";
import { cn } from "@/lib/utils";

export function NotificationsPopover() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<FinancialInsight[]>([]);
  const [loadedOnce, setLoadedOnce] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    const result = await getFinancialInsights();
    if (result.ok) {
      setInsights(result.insights);
      setLoadedOnce(true);
    }
    setLoading(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    // Carrega apenas na primeira abertura para economizar tokens e evitar loading constante
    if (isOpen && !loadedOnce && !loading) {
      fetchInsights();
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 relative"
          aria-label="Insights Financeiros"
        >
          <Bell className="h-4 w-4" />
          {/* Bolinha de notificação apenas se houver insights */}
          {insights.length > 0 && (
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 border-zinc-800 bg-zinc-900 shadow-xl mr-4" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
          <h4 className="font-semibold text-sm text-zinc-100 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
            Omni Insights
          </h4>
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium border border-zinc-800 px-1.5 py-0.5 rounded">
            IA Beta
          </span>
        </div>
        
        <div className="min-h-[100px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-zinc-500 gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
              <p className="text-xs font-medium">Analisando suas finanças...</p>
            </div>
          ) : insights.length > 0 ? (
            <div className="divide-y divide-zinc-800/50">
              {insights.map((insight, i) => {
                const iconColor = 
                  insight.type === 'warning' ? "text-amber-500" :
                  insight.type === 'success' ? "text-emerald-500" :
                  "text-blue-500";

                return (
                  <div key={`${i}-${insight.type}`} className="flex gap-3 px-4 py-4 hover:bg-zinc-800/30 transition-colors">
                    <div className={cn("mt-0.5 shrink-0", iconColor)}>
                      {insight.type === 'warning' && <AlertTriangle className="h-4 w-4" />}
                      {insight.type === 'success' && <CheckCircle className="h-4 w-4" />}
                      {insight.type === 'info' && <Info className="h-4 w-4" />}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-zinc-300 leading-relaxed">
                        {insight.message}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-10 text-center text-zinc-500 text-xs px-6">
              <p>Você está em dia!</p>
              <p className="mt-1 opacity-70">A IA avisará se encontrar algo importante.</p>
            </div>
          )}
        </div>

        {insights.length > 0 && (
          <div className="p-2 border-t border-zinc-800 bg-zinc-900/50">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full h-8 text-xs text-zinc-500 hover:text-red-400 hover:bg-red-500/10 gap-2"
              onClick={() => setInsights([])}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Limpar notificações
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
