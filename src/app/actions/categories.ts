"use server";

import { createClient } from "@/lib/supabase/server";
import { getOrCreateCategory } from "@/services/transactions";
import type { Category } from "@/db/schema";

export type CreateCategoryResult =
  | { ok: true; category: Pick<Category, "id" | "name" | "type"> }
  | { ok: false; error: string };

export async function createCategoryIfNotExists(
  name: string,
  type: "income" | "expense",
): Promise<CreateCategoryResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const trimmed = name?.trim();
  if (!trimmed) return { ok: false, error: "Nome da categoria é obrigatório" };

  try {
    const category = await getOrCreateCategory(user.id, trimmed, type);
    return {
      ok: true,
      category: { id: category.id, name: category.name, type: category.type },
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao criar categoria";
    return { ok: false, error: message };
  }
}
