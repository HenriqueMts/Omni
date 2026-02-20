"use client";

import * as React from "react";
import { Send, Sparkles, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAIChat } from "@/contexts/ai-chat-context";
import { getAIChatSuggestions, sendAIChatMessage } from "@/app/actions/ai-chat";
import type { ChatMessage } from "@/app/actions/ai-chat";

type Props = Readonly<{ userName?: string | null }>;

export function AIChatPanel({ userName }: Props) {
  const { open, setOpen } = useAIChat();
  const [input, setInput] = React.useState("");
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const displayName = userName?.trim() || "você";

  React.useEffect(() => {
    if (open && suggestions.length === 0) {
      setSuggestionsLoading(true);
      setError(null);
      getAIChatSuggestions()
        .then((res) => {
          if (res.ok) setSuggestions(res.suggestions);
        })
        .finally(() => setSuggestionsLoading(false));
    }
  }, [open, suggestions.length]);

  React.useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      }, 100);
    }
  }, [messages]);

  async function handleSend(text?: string) {
    const toSend = (text ?? input.trim()).trim();
    if (!toSend || sending) return;
    setInput("");
    setError(null);
    const userMessage: ChatMessage = { role: "user", content: toSend };
    setMessages((prev) => [...prev, userMessage]);
    setSending(true);
    const result = await sendAIChatMessage([...messages, userMessage], toSend);
    setSending(false);
    if (result.ok) {
      setMessages((prev) => [...prev, { role: "assistant", content: result.reply }]);
    } else {
      setError(result.error ?? "Erro ao enviar");
    }
    inputRef.current?.focus();
  }

  function handleSuggestionClick(s: string) {
    handleSend(s);
  }

  const hasMessages = messages.length > 0;

  React.useEffect(() => {
    if (!open) return;
    
    const input = inputRef.current;
    if (!input) return;

    const handleFocus = () => {
      // Quando o input recebe foco, scrolla para o final após o teclado aparecer
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      }, 400);
    };

    const handleInput = () => {
      // Mantém scroll no final enquanto digita
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "auto" });
      }, 50);
    };

    input.addEventListener("focus", handleFocus);
    input.addEventListener("input", handleInput);
    
    return () => {
      input.removeEventListener("focus", handleFocus);
      input.removeEventListener("input", handleInput);
    };
  }, [open]);


  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="flex w-full flex-col border-zinc-800 bg-zinc-950 p-0 h-dvh max-h-dvh sm:h-auto sm:max-h-[90vh] sm:max-w-md"
        showCloseButton={true}
      >
        <SheetHeader className="shrink-0 border-b border-zinc-800 px-4 py-4">
          <SheetTitle className="text-left text-zinc-100 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <Sparkles className="h-4 w-4" />
            </span>
            {" "}
            Assistente Omni
          </SheetTitle>
          <p className="text-left text-sm text-zinc-500">
            Tire dúvidas, peça resumos e dicas no contexto das suas finanças.
          </p>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-hidden min-h-0">
          <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 pb-20">
            {!hasMessages && (
              <div className="space-y-2">
                <p className="text-sm text-zinc-400">Olá, {displayName}</p>
                <p className="text-lg font-semibold text-zinc-100">Por onde começamos?</p>
                <div className="flex items-start gap-3 pt-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <span className="text-sm">◇</span>
                  </div>
                  <p className="text-sm text-zinc-500">
                    Pergunte sobre resumo do mês, economia, gastos, metas ou planejamento. Escolha uma sugestão abaixo ou digite sua dúvida.
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={`${msg.role}-${i}-${msg.content.slice(0, 20)}`}
                className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                {msg.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <span className="text-sm">◇</span>
                  </div>
                )}
                <div
                  className={`rounded-lg px-3 py-2 text-sm max-w-[85%] ${
                    msg.role === "user"
                      ? "bg-emerald-600/20 text-zinc-100"
                      : "bg-zinc-800/80 text-zinc-200"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
                <div className="rounded-lg bg-zinc-800/80 px-3 py-2 text-sm text-zinc-500">
                  Pensando...
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            )}

            {/* Botões de sugestão */}
            <div className="pt-2">
              {suggestionsLoading ? (
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="h-9 w-24 rounded-lg bg-zinc-800/80 animate-pulse"
                      aria-hidden
                    />
                  ))}
                </div>
              ) : (
                suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((s) => (
                      <Button
                        key={s}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-lg border-zinc-700 bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700 hover:text-zinc-100 text-xs font-normal h-auto py-2 px-3"
                        onClick={() => handleSuggestionClick(s)}
                        disabled={sending}
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>

          <div className="border-t border-zinc-800 p-4 shrink-0 bg-zinc-950">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 focus-within:ring-2 focus-within:ring-emerald-500/30"
            >
              <input
                ref={inputRef}
                type="text"
                placeholder="Pergunte sobre suas finanças..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 min-w-0 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
                disabled={sending}
              />
              <Button
                type="submit"
                size="icon"
                className="h-8 w-8 shrink-0 bg-emerald-600 hover:bg-emerald-500"
                aria-label="Enviar"
                disabled={sending || !input.trim()}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
