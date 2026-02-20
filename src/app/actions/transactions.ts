"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createTransaction as createTransactionService,
  type CreateTransactionInput,
} from "@/services/transactions";

export async function createTransaction(data: CreateTransactionInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  if (!data.accountId?.trim()) return { ok: false, error: "Conta é obrigatória" };
  const amount = Number(data.amount);
  if (Number.isNaN(amount)) return { ok: false, error: "Valor inválido" };
  const validTypes = ["income", "expense", "transfer"] as const;
  if (!data.type || !validTypes.includes(data.type))
    return { ok: false, error: "Tipo inválido" };
  if (!data.date?.trim()) return { ok: false, error: "Data é obrigatória" };

  try {
    await createTransactionService(user.id, {
      ...data,
      categoryId: data.categoryId?.trim() || null,
      description: data.description?.trim() || null,
    });
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/transactions");
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Erro ao criar transação" };
  }
}
