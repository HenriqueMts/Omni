"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { useAIChat } from "@/contexts/ai-chat-context";
import { cn } from "@/lib/utils";

const MESSAGE_DURATION_MS = 5000;
const MESSAGE_HAS_BEEN_SHOWN_KEY = "omni-ai-orb-message-shown";

export function FloatingAIOrb() {
  const { setOpen } = useAIChat();
  const [messageOpen, setMessageOpen] = React.useState(false);
  const [isHiding, setIsHiding] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    const alreadyShown =
      typeof globalThis.window !== "undefined" &&
      globalThis.sessionStorage.getItem(MESSAGE_HAS_BEEN_SHOWN_KEY);
    if (alreadyShown) return;

    const showMessage = () => {
      setMessageOpen(true);
      if (typeof globalThis.window !== "undefined")
        globalThis.sessionStorage.setItem(MESSAGE_HAS_BEEN_SHOWN_KEY, "1");
    };

    const t = setTimeout(showMessage, 800);
    return () => clearTimeout(t);
  }, []);

  React.useEffect(() => {
    if (!messageOpen) return;

    const startClose = () => {
      setIsHiding(true);
      timeoutRef.current = setTimeout(() => {
        setMessageOpen(false);
        setIsHiding(false);
        timeoutRef.current = null;
      }, 300);
    };

    const t = setTimeout(startClose, MESSAGE_DURATION_MS);
    return () => {
      clearTimeout(t);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [messageOpen]);

  const handleOrbClick = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setMessageOpen(false);
    setIsHiding(false);
    setOpen(true);
  };

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2"
      aria-label="Abrir assistente Omni AI"
    >
      {/* Bolha de mensagem — à esquerda da orb */}
      {messageOpen && (
        <div
          className={cn(
            "flex items-center rounded-full bg-zinc-800/95 px-4 py-2.5 shadow-lg ring-1 ring-zinc-700/50 backdrop-blur-sm",
            "transition-all duration-300 ease-out",
            isHiding
              ? "translate-x-2 opacity-0"
              : "translate-x-0 opacity-100"
          )}
        >
          <span className="text-sm font-medium text-zinc-100 whitespace-nowrap">
            Como posso te ajudar?
          </span>
        </div>
      )}

      {/* Orb neutra — esfera preta, ícone branco (3 brilhos) */}
      <button
        type="button"
        onClick={handleOrbClick}
        className={cn(
          "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
          "bg-zinc-900 ring-2 ring-zinc-700/80 shadow-xl",
          "transition-transform hover:scale-110 active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        )}
        aria-label="Perguntar ao Omni AI"
      >
        <Sparkles className="h-5 w-5 text-white" strokeWidth={2} />
      </button>
    </div>
  );
}
