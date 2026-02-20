import { ReactNode, Suspense } from "react";
import { redirect } from "next/navigation";
import { AppSidebar } from "../../components/dashboard/app-sidebar";
import { DashboardHeader } from "../../components/dashboard/dashboard-header";
import { AIChatPanel } from "../../components/dashboard/ai-chat-panel";
import { FloatingAIOrb } from "../../components/dashboard/floating-ai-orb";
import { WelcomeToast } from "@/components/dashboard/welcome-toast";
import { ImportStatementModal } from "@/components/import/import-statement-modal";
import { AIChatProvider } from "@/contexts/ai-chat-context";
import { ImportStatementProvider } from "@/contexts/import-statement-context";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { getAuthUser } from "@/lib/supabase/server";
import { getProfileById, ensureProfile } from "@/services/profile";
import { getAccountsByUserId } from "@/services/accounts";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { user: authUser } = await getAuthUser();
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

  const accounts = await getAccountsByUserId(authUser.id);

  return (
    <AIChatProvider>
      <ImportStatementProvider>
        <Suspense fallback={null}>
          <WelcomeToast />
        </Suspense>
        <SidebarProvider className="dark bg-background text-foreground overflow-hidden min-h-svh flex w-full">
          <AppSidebar user={user} />
          <SidebarInset>
            <DashboardHeader />
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 scrollbar-thin scrollbar-thumb-zinc-800">
              {children}
            </div>
          </SidebarInset>
          <AIChatPanel userName={user.name} />
          <FloatingAIOrb />
          <ImportStatementModal accounts={accounts} />
        </SidebarProvider>
      </ImportStatementProvider>
    </AIChatProvider>
  );
}
