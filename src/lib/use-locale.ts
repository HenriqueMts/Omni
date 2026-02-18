"use client";

import { useState, useEffect } from "react";

/** Retorna o locale do navegador (linguagem do sistema). Fallback: pt-BR. */
export function useLocale(): string {
  const [locale, setLocale] = useState("pt-BR");

  useEffect(() => {
    const lang =
      typeof navigator !== "undefined"
        ? navigator.language ?? navigator.languages?.[0]
        : "pt-BR";
    setLocale(lang ?? "pt-BR");
  }, []);

  return locale;
}
