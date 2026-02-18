import { ReactNode } from "react";
import { AppSidebar } from "../../components/dashboard/app-sidebar";
import { DashboardHeader } from "../../components/dashboard/dashboard-header";
import { AIChatPanel } from "../../components/dashboard/ai-chat-panel";
import { AIChatProvider } from "@/contexts/ai-chat-context";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AIChatProvider>
      <SidebarProvider className="dark bg-zinc-950 text-zinc-50 overflow-hidden min-h-svh flex w-full">
        <AppSidebar />
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
