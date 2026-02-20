"use client";

import * as React from "react";
import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  PieChart,
  ArrowRightLeft,
  Settings,
  LifeBuoy,
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
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navMain = [
  { title: "Visão Geral", url: "/dashboard", icon: LayoutDashboard },
  { title: "Contas", url: "/dashboard/accounts", icon: Wallet },
  { title: "Cartão de crédito", url: "/dashboard/cards", icon: CreditCard },
  {
    title: "Transações",
    url: "/dashboard/transactions",
    icon: ArrowRightLeft,
  },
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

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="w-full pl-5 pr-5 pt-3 pb-2 group-data-[collapsible=icon]:p-2">
        <div className="flex items-center gap-2 mb-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:mb-2">
          <span className="font-semibold text-zinc-100 text-sm group-data-[collapsible=icon]:hidden">
            Omni
          </span>
          <span className="inline-flex items-center rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400 ring-1 ring-emerald-500/30">
            beta
          </span>
        </div>
        <NavUser user={user} />
      </SidebarHeader>

      <SidebarContent className="px-3 group-data-[collapsible=icon]:px-2">
        {/* 2. NAVEGAÇÃO PRINCIPAL */}
        <SidebarGroup className="group-data-[collapsible=icon]:px-0">
          <SidebarGroupLabel>Plataforma</SidebarGroupLabel>
          <SidebarMenu>
            {navMain.map((item) => {
              const isActive = pathname === item.url;
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
        <SidebarGroup className="mt-auto group-data-[collapsible=icon]:px-0">
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

      {/* 4. RODAPÉ */}
      <SidebarFooter className="px-3">
        <div className="py-2 text-xs text-zinc-600 group-data-[collapsible=icon]:hidden text-center">
          Omni · beta
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
