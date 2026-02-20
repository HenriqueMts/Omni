"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  LogOut,
  Pencil,
  Sparkles,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { AvatarImportModal } from "@/components/dashboard/avatar-import-modal";
import { AvatarCropModal } from "@/components/dashboard/avatar-crop-modal";
import { uploadAvatar } from "@/app/actions/upload";
import { logout } from "@/app/(auth)/login/actions";

const AVATAR_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const AVATAR_MAX_MB = 5;

function formatFirstNameLastName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 2) return fullName;
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

export function NavUser({
  user,
}: Readonly<{
  user: { id: string; name: string; email: string; avatar: string };
}>) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [pendingImageSrc, setPendingImageSrc] = useState<string | null>(null);

  function handleAvatarInteraction(e: React.MouseEvent | React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (uploading) return;
    setImportModalOpen(true);
  }

  function handleFileSelected(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      setPendingImageSrc(reader.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  }

  async function handleCropComplete(blob: Blob) {
    setUploading(true);
    const formData = new FormData();
    formData.set("file", blob, "avatar.jpg");
    const result = await uploadAvatar(formData);
    setUploading(false);
    setPendingImageSrc(null);
    if (result.ok) router.refresh();
    else alert(result.error);
  }

  async function handleLogout() {
    await logout();
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem suppressHydrationWarning>
        <AvatarImportModal
          open={importModalOpen}
          onOpenChange={setImportModalOpen}
          onFileSelected={handleFileSelected}
        />
        <AvatarCropModal
          open={cropModalOpen}
          onOpenChange={setCropModalOpen}
          imageSrc={pendingImageSrc ?? ""}
          onCropComplete={handleCropComplete}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center"
              suppressHydrationWarning
            >
              <div
                role="button"
                tabIndex={0}
                onClick={handleAvatarInteraction}
                onPointerDown={handleAvatarInteraction}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAvatarInteraction(e as unknown as React.MouseEvent);
                  }
                }}
                className="relative group/avatar-edit shrink-0 rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
                aria-label="Alterar foto de perfil"
              >
                <Avatar className="h-8 w-8 rounded-full overflow-hidden">
                  <AvatarImage
                    src={user.avatar}
                    alt={user.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="rounded-full text-xs">
                    {user.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover/avatar-edit:opacity-100 transition-opacity">
                  <Pencil className="h-4 w-4 text-white" />
                </div>
                {uploading && (
                  <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                    <span className="text-xs text-white font-medium">...</span>
                  </div>
                )}
              </div>
              <span className="flex-1 truncate text-left text-sm font-semibold group-data-[collapsible=icon]:hidden">
                {formatFirstNameLastName(user.name)}
              </span>
              <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg bg-zinc-900 border-zinc-800 text-zinc-200"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-full shrink-0 overflow-hidden">
                  <AvatarImage
                    src={user.avatar}
                    alt={user.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="rounded-full text-xs">
                    {user.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs text-zinc-400">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuGroup>
              <DropdownMenuItem className="focus:bg-zinc-800 cursor-pointer">
                <Sparkles className="mr-2 h-4 w-4 text-emerald-500" />
                Assinar Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuGroup>
              <DropdownMenuItem className="focus:bg-zinc-800 cursor-pointer">
                <BadgeCheck className="mr-2 h-4 w-4" />
                Conta
              </DropdownMenuItem>
              <DropdownMenuItem className="focus:bg-zinc-800 cursor-pointer">
                <Bell className="mr-2 h-4 w-4" />
                Notificações
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem
              className="focus:bg-zinc-800 text-red-400 cursor-pointer"
              onSelect={(e) => {
                e.preventDefault();
                handleLogout();
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
