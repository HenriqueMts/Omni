"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";

const AVATAR_BUCKET = "avatars";
const AVATAR_MAX_BYTES = 5 * 1024 * 1024; // 5MB
const AVATAR_MIMES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
const AVATAR_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const DOCUMENTS_BUCKET = "documents";
const DOCUMENTS_MAX_BYTES = 10 * 1024 * 1024; // 10MB
const DOCUMENTS_MIMES = [
  "application/pdf",
  "text/plain",
  "application/x-ofx",
  "text/ofx",
] as const;
const DOCUMENTS_EXT = new Set([".pdf", ".txt", ".ofx"]);

export type UploadAvatarResult = { ok: true; url: string } | { ok: false; error: string };
export type UploadDocumentResult = { ok: true; path: string } | { ok: false; error: string };

export async function uploadAvatar(formData: FormData): Promise<UploadAvatarResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const file = formData.get("file") as File | null;
  if (!file?.size) return { ok: false, error: "Nenhum arquivo enviado" };
  if (file.size > AVATAR_MAX_BYTES) return { ok: false, error: "Arquivo maior que 5 MB" };
  if (!AVATAR_MIMES.includes(file.type as (typeof AVATAR_MIMES)[number])) {
    return { ok: false, error: "Formato inválido. Use JPEG, PNG, WebP ou GIF." };
  }

  const ext = AVATAR_EXT[file.type] ?? "jpg";
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { upsert: true });

  if (uploadError) return { ok: false, error: uploadError.message };

  const { data: urlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  await db
    .update(profiles)
    .set({ avatarUrl: publicUrl, updatedAt: new Date() })
    .where(eq(profiles.id, user.id));

  revalidatePath("/dashboard", "layout");
  return { ok: true, url: publicUrl };
}

export async function uploadStatement(formData: FormData): Promise<UploadDocumentResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado" };

  const file = formData.get("file") as File | null;
  if (!file?.size) return { ok: false, error: "Nenhum arquivo enviado" };
  if (file.size > DOCUMENTS_MAX_BYTES) return { ok: false, error: "Arquivo maior que 10 MB" };

  const ext = file.name.split(".").pop()?.toLowerCase();
  const allowedMime = [...DOCUMENTS_MIMES].includes(file.type as (typeof DOCUMENTS_MIMES)[number]);
  const allowedExt = ext && DOCUMENTS_EXT.has(`.${ext}`);
  if (!allowedMime && !allowedExt) {
    return {
      ok: false,
      error: "Formato inválido. Use PDF, TXT ou OFX.",
    };
  }

  const safeName = file.name.replaceAll(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
  const path = `${user.id}/${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(path, file, { upsert: false });

  if (uploadError) return { ok: false, error: uploadError.message };

  revalidatePath("/dashboard/import", "layout");
  return { ok: true, path };
}
