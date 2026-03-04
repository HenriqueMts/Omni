"use client";

import { Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { NotificationsPopover } from "./notifications-popover";

export function DashboardHeader() {
  return (
    <header className=" box-border flex h-16 items-center gap-4 border-b border-zinc-800 px-4 md:px-6 bg-zinc-950/50 backdrop-blur-xl z-10">
      <SidebarTrigger className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 shrink-0" />
      <h1 className="text-lg font-semibold text-zinc-100 shrink-0 hidden sm:block">
        Visão Geral
      </h1>
      <div className="flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            type="search"
            placeholder="Buscar..."
            className="pl-9 h-9 bg-zinc-900/80 border-zinc-800 text-zinc-200 placeholder:text-zinc-500 focus-visible:ring-emerald-500/50"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 ml-auto shrink-0">
        <NotificationsPopover />
      </div>
    </header>
  );
}
