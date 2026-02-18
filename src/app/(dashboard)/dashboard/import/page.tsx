import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAccountsByUserId } from "@/services/accounts";
import { StatementUploadCard } from "@/components/import/statement-upload-card";

export default async function ImportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const accounts = await getAccountsByUserId(user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-500">Dashboard &gt; Importar extrato</p>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-zinc-100">Importar extrato</h2>
        <p className="text-zinc-500 mt-0.5">
          Envie PDF, TXT ou OFX do seu banco. A IA extrai as transações; depois importe para uma conta.
        </p>
      </div>
      <StatementUploadCard accounts={accounts} />
    </div>
  );
}
