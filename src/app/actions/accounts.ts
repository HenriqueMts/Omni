"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createAccount as createAccountService,
  updateAccount as updateAccountService,
  deleteAccount as deleteAccountService,
} from "@/services/accounts";
import type { AccountType } from "@/db/schema";

export async function createAccount(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const name = formData.get("name") as string;
  const type = formData.get("type") as AccountType;
  const balanceRaw = formData.get("balance");
  const balance =
    balanceRaw != null && typeof balanceRaw === "string" ? balanceRaw : "0";
  const color = (formData.get("color") as string) || "#000000";

  if (!name?.trim()) return { ok: false, error: "Nome é obrigatório" };
  const validTypes: AccountType[] = ["checking", "savings", "credit_card", "investment", "cash"];
  if (!type || !validTypes.includes(type)) return { ok: false, error: "Tipo inválido" };

  const balanceNum = Number(balance);
  if (Number.isNaN(balanceNum)) return { ok: false, error: "Saldo inválido" };

  try {
    await createAccountService(user.id, {
      name: name.trim(),
      type,
      balance: balanceNum.toFixed(2),
      color: color.trim() || undefined,
    });
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/accounts");
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Erro ao criar conta" };
  }
}

export async function updateAccount(accountId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const name = formData.get("name") as string;
  const type = formData.get("type") as AccountType;
  const balanceRaw = formData.get("balance");
  const balance =
    balanceRaw != null && typeof balanceRaw === "string" ? balanceRaw : undefined;
  const color = formData.get("color") as string | undefined;

  if (!name?.trim()) return { ok: false, error: "Nome é obrigatório" };
  const validTypes: AccountType[] = ["checking", "savings", "credit_card", "investment", "cash"];
  if (!type || !validTypes.includes(type)) return { ok: false, error: "Tipo inválido" };

  const data: Parameters<typeof updateAccountService>[2] = {
    name: name.trim(),
    type,
    color: color?.trim() || undefined,
  };
  if (balance !== undefined && balance !== "") {
    const balanceNum = Number(balance);
    if (!Number.isNaN(balanceNum)) data.balance = balanceNum.toFixed(2);
  }

  try {
    const row = await updateAccountService(accountId, user.id, data);
    if (!row) return { ok: false, error: "Conta não encontrada" };
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/accounts");
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Erro ao atualizar conta" };
  }
}

export async function deleteAccount(accountId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  try {
    const deleted = await deleteAccountService(accountId, user.id);
    if (!deleted) return { ok: false, error: "Conta não encontrada" };
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/accounts");
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Erro ao excluir conta" };
  }
}
