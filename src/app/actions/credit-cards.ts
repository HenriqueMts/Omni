"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createCreditCard as createCreditCardService, deleteCreditCard as deleteCreditCardService } from "@/services/credit-cards";

export type CreateCreditCardResult =
  | { ok: true }
  | { ok: false; error: string };

export async function createCreditCard(formData: FormData): Promise<CreateCreditCardResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const last4 = (formData.get("last4") as string)?.trim() ?? "";
  const holderName = (formData.get("holderName") as string)?.trim() ?? "";
  const expiryMonth = (formData.get("expiryMonth") as string)?.trim() ?? "";
  const expiryYear = (formData.get("expiryYear") as string)?.trim() ?? "";
  const gradientKey = (formData.get("gradientKey") as string)?.trim() || "orange_red";

  const digitsOnly = last4.replaceAll(/\D/g, "");
  if (digitsOnly.length !== 4) return { ok: false, error: "Informe os 4 últimos dígitos do cartão." };
  if (!holderName) return { ok: false, error: "Nome do titular é obrigatório." };
  const month = expiryMonth.replaceAll(/\D/g, "").slice(0, 2).padStart(2, "0");
  const year = expiryYear.replaceAll(/\D/g, "").slice(-2);
  if (!month || !year) return { ok: false, error: "Data de validade é obrigatória." };

  try {
    await createCreditCardService(user.id, {
      last4: digitsOnly,
      holderName,
      expiryMonth: month,
      expiryYear: year,
      gradientKey,
    });
    revalidatePath("/dashboard/cards");
    revalidatePath("/dashboard", "layout");
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao cadastrar cartão";
    return { ok: false, error: message };
  }
}

export async function deleteCreditCard(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };
  try {
    await deleteCreditCardService(id, user.id);
    revalidatePath("/dashboard/cards");
    revalidatePath("/dashboard", "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao excluir" };
  }
}
