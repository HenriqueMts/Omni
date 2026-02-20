import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getReportsData } from "@/services/reports";
import { ReportsContent } from "@/components/reports/reports-content";

export default async function ReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await getReportsData(user.id);

  return <ReportsContent data={data} />;
}
