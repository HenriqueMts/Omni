"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLoginErrorMessage, getSignupErrorMessage } from "@/lib/auth-errors";

export type LoginState = { error?: string } | null;
export type SignupState = { error?: string; success?: string } | null;

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: getLoginErrorMessage(error) };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard?welcome=1");
}

export async function signup(
  _prevState: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return { error: getSignupErrorMessage(error) };
  }

  // Supabase exige confirmação de email: sessão só existe após confirmar
  if (!data.session) {
    return { success: "confirm_email" };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard?welcome=1");
}

export async function logout() {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  await supabase.auth.signOut();
  const { revalidatePath } = await import("next/cache");
  const { redirect } = await import("next/navigation");
  revalidatePath("/", "layout");
  redirect("/login");
}
