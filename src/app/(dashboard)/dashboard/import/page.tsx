import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAccountsByUserId } from "@/services/accounts";
import { ImportPageContent } from "@/components/import/import-page-content";

export default async function ImportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const accounts = await getAccountsByUserId(user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in-up animate-opacity-0">
        <p className="text-sm text-zinc-500">Dashboard &gt; Importar extrato</p>
      </div>
      <div className="animate-fade-in-up animate-opacity-0 animate-delay-1">
        <h2 className="text-2xl font-bold text-zinc-100">Importar extrato</h2>
        <p className="text-zinc-500 mt-0.5">
          Envie PDF, TXT ou OFX do seu banco. A IA extrai as transações; depois importe para uma conta.
        </p>
      </div>
      <ImportPageContent accounts={accounts} />
    </div>
  );
}
