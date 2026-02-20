import type { AuthError } from "@supabase/supabase-js";

const LOGIN_MESSAGES: Record<string, string> = {
  invalid_credentials: "Email ou senha incorretos.",
  "Invalid login credentials": "Email ou senha incorretos.",
  "Email not confirmed": "Confirme seu email antes de entrar. Verifique sua caixa de entrada.",
  user_banned: "Esta conta foi desativada.",
  "Too many requests": "Muitas tentativas. Aguarde um momento e tente novamente.",
};

const SIGNUP_MESSAGES: Record<string, string> = {
  user_already_registered: "Já existe uma conta com este email. Faça login.",
  "User already registered": "Já existe uma conta com este email. Faça login.",
  "Password should be at least 6 characters": "A senha deve ter no mínimo 6 caracteres.",
  "Signup requires a valid password": "Digite uma senha válida.",
  "Unable to validate email address: invalid format": "Formato de email inválido.",
  "Too many requests": "Muitas tentativas. Aguarde um momento e tente novamente.",
};

function matchMessage(msg: string, map: Record<string, string>): string {
  const exact = map[msg];
  if (exact) return exact;
  const lower = msg.toLowerCase();
  if (lower.includes("email") && lower.includes("invalid")) return "Email inválido.";
  if (lower.includes("password") && lower.includes("weak")) return "Senha muito fraca. Use letras, números e símbolos.";
  if (lower.includes("already") && lower.includes("registered")) return SIGNUP_MESSAGES["User already registered"];
  if (lower.includes("invalid login")) return LOGIN_MESSAGES["Invalid login credentials"];
  return msg;
}

export function getLoginErrorMessage(error: AuthError | null): string {
  if (!error) return "Erro ao entrar. Tente novamente.";
  const byCode = error.code && LOGIN_MESSAGES[error.code];
  if (byCode) return byCode;
  return matchMessage(error.message, LOGIN_MESSAGES) || error.message;
}

export function getSignupErrorMessage(error: AuthError | null): string {
  if (!error) return "Erro ao criar conta. Tente novamente.";
  const byCode = error.code && SIGNUP_MESSAGES[error.code];
  if (byCode) return byCode;
  return matchMessage(error.message, SIGNUP_MESSAGES) || error.message;
}
