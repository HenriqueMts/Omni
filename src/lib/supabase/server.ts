import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";

function isInvalidSessionError(err: unknown): boolean {
  const e = err as { code?: string; __isAuthError?: boolean; status?: number };
  return (
    e?.code === "refresh_token_not_found" ||
    (e?.__isAuthError === true && e?.status === 400)
  );
}

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // O método setAll foi chamado de um Server Component.
            // Isso pode ser ignorado se você tiver middleware atualizando a sessão.
          }
        },
      },
    },
  );
}

/**
 * Obtém o usuário autenticado. Se a sessão for inválida (ex.: refresh token
 * de outro projeto Supabase), limpa os cookies e retorna null.
 */
export async function getAuthUser(): Promise<{
  user: User | null;
  supabase: Awaited<ReturnType<typeof createClient>>;
}> {
  const supabase = await createClient();
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    return { user, supabase };
  } catch (err) {
    if (isInvalidSessionError(err)) {
      await supabase.auth.signOut();
      return { user: null, supabase };
    }
    throw err;
  }
}
