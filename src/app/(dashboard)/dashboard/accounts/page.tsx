import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAccountsByUserId } from "@/services/accounts";
import { AccountsList } from "@/components/accounts/accounts-list";

export default async function AccountsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const accounts = await getAccountsByUserId(user.id);

  return (
    <div className="space-y-6">
      <AccountsList accounts={accounts} />
    </div>
  );
}
