/** Mapeamento de tipos de transação por locale. Escalável para novas línguas. */
const LABELS: Record<string, Record<string, string>> = {
  pt: {
    income: "Entrada",
    expense: "Saída",
    transfer: "Transferência",
  },
  "pt-BR": {
    income: "Entrada",
    expense: "Saída",
    transfer: "Transferência",
  },
  en: {
    income: "Income",
    expense: "Expense",
    transfer: "Transfer",
  },
  es: {
    income: "Ingreso",
    expense: "Gasto",
    transfer: "Transferencia",
  },
};

/**
 * Retorna o label do tipo de transação no idioma desejado.
 * Usa a linguagem do sistema (locale) quando disponível.
 * @param type - income | expense | transfer
 * @param locale - pt-BR, en, es, etc. (default: pt-BR)
 */
export function getTransactionTypeLabel(
  type: string,
  locale?: string | null
): string {
  const lang = (locale ?? "pt-BR").toLowerCase().replace("_", "-");
  const exact = LABELS[lang];
  const base = LABELS[lang.slice(0, 2)];
  const labels = exact ?? base ?? LABELS["pt-BR"];
  return labels[type] ?? type;
}
