/** Chave normalizada para comparar nomes (sem acento, minúscula). */
export function normalizeCategoryName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replaceAll(/\p{Diacritic}/gu, "");
}

/** Remove duplicatas por nome normalizado; mantém a primeira ocorrência de cada. */
export function uniqueCategoriesByName<T extends { id: string; name: string }>(
  categories: T[],
): T[] {
  const seen = new Set<string>();
  return categories.filter((c) => {
    const key = normalizeCategoryName(c.name);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
