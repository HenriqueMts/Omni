"use client";

import * as React from "react";
import { Paperclip, Send } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAIChat } from "@/contexts/ai-chat-context";

export function AIChatPanel() {
  const { open, setOpen } = useAIChat();
  const [input, setInput] = React.useState("");

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="flex w-full flex-col border-zinc-800 bg-zinc-950 p-0 sm:max-w-md"
        showCloseButton={true}
      >
        <SheetHeader className="border-b border-zinc-800 px-4 py-4">
          <SheetTitle className="text-left text-zinc-100">
            Assistente Omni
          </SheetTitle>
          <p className="text-left text-sm text-zinc-500">
            Tire dúvidas, peça relatórios ou planos de ação.
          </p>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Área de mensagens */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <span className="text-sm">◇</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-zinc-200">
                  Bom te ver por aqui.
                </p>
                <p className="text-sm text-zinc-500">
                  Pergunte qualquer coisa sobre suas finanças, peça um resumo do
                  mês, sugestões de economia ou um plano de ação. Como posso
                  ajudar?
                </p>
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-zinc-800 p-4">
            <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 focus-within:ring-2 focus-within:ring-emerald-500/30">
              <input
                type="text"
                placeholder="Pergunte qualquer coisa..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-zinc-500 hover:text-zinc-300"
                aria-label="Anexar"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                className="h-8 w-8 shrink-0 bg-emerald-600 hover:bg-emerald-500"
                aria-label="Enviar"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
