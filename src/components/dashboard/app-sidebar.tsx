"use client";

import * as React from "react";
import {
  LayoutDashboard,
  Wallet,
  PieChart,
  ArrowRightLeft,
  Settings,
  LifeBuoy,
  Bot,
  Upload,
} from "lucide-react";

import { NavUser } from "@/components/dashboard/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAIChat } from "@/contexts/ai-chat-context";

const navMain = [
    { title: "Visão Geral", url: "/dashboard", icon: LayoutDashboard },
    {
      title: "Assistente IA",
      url: "#",
      icon: Bot,
      isChat: true,
    },
    {
      title: "Transações",
      url: "/dashboard/transactions",
      icon: ArrowRightLeft,
    },
    {
      title: "Importar extrato",
      url: "/dashboard/import",
      icon: Upload,
    },
    { title: "Contas", url: "/dashboard/accounts", icon: Wallet },
    { title: "Relatórios", url: "/dashboard/reports", icon: PieChart },
  ];
const navSecondary = [
  { title: "Configurações", url: "/dashboard/settings", icon: Settings },
  { title: "Ajuda", url: "/help", icon: LifeBuoy },
];

type SidebarUser = { id: string; name: string; email: string; avatar: string };

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: SidebarUser }) {
  const pathname = usePathname();
  const { setOpen: setChatOpen } = useAIChat();

  return (
    <Sidebar collapsible="icon" {...props} className="border-r-zinc-800">
      <SidebarHeader>
        <NavUser user={user} />
      </SidebarHeader>

      <SidebarContent>
        {/* 2. NAVEGAÇÃO PRINCIPAL */}
        <SidebarGroup>
          <SidebarGroupLabel>Plataforma</SidebarGroupLabel>
          <SidebarMenu>
            {navMain.map((item) => {
              const isChat = "isChat" in item && item.isChat;
              const isActive = !isChat && pathname === item.url;
              if (isChat) {
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      className="hover:bg-zinc-800 text-zinc-400 hover:text-emerald-500"
                      onClick={() => setChatOpen(true)}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              }
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isActive}
                    className="hover:bg-zinc-800 text-zinc-400 data-[active=true]:text-emerald-500 data-[active=true]:bg-zinc-900"
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>

        {/* 3. NAVEGAÇÃO SECUNDÁRIA */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>Suporte</SidebarGroupLabel>
          <SidebarMenu>
            {navSecondary.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  size="sm"
                  tooltip={item.title}
                  className="text-zinc-500 hover:text-zinc-200"
                >
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* 4. RODAPÉ (PODE TER LOGO OU VERSÃO) */}
      <SidebarFooter>
        <div className="p-2 text-xs text-zinc-600 group-data-[collapsible=icon]:hidden text-center">
          v1.0.0 Alpha
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
