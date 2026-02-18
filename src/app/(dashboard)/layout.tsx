import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppSidebar } from "../../components/dashboard/app-sidebar";
import { DashboardHeader } from "../../components/dashboard/dashboard-header";
import { AIChatPanel } from "../../components/dashboard/ai-chat-panel";
import { AIChatProvider } from "@/contexts/ai-chat-context";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/server";
import { getProfileById, ensureProfile } from "@/services/profile";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  await ensureProfile(
    authUser.id,
    authUser.email ?? "",
    authUser.user_metadata?.full_name,
  );
  const profile = await getProfileById(authUser.id);
  const user = {
    id: authUser.id,
    name: profile?.fullName ?? authUser.user_metadata?.full_name ?? authUser.email?.split("@")[0] ?? "Usuário",
    email: authUser.email ?? "",
    avatar: profile?.avatarUrl ?? "",
  };

  return (
    <AIChatProvider>
      <SidebarProvider className="dark bg-zinc-950 text-zinc-50 overflow-hidden min-h-svh flex w-full">
        <AppSidebar user={user} />
        <SidebarInset>
          <DashboardHeader />
          <div className="flex-1 min-h-0 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-zinc-800">
            {children}
          </div>
        </SidebarInset>
        <AIChatPanel />
      </SidebarProvider>
    </AIChatProvider>
  );
}
