"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "dark" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-zinc-900 group-[.toaster]:text-zinc-100 group-[.toaster]:border-zinc-800 group-[.toaster]:shadow-lg",
          description: "group-[.toaster]:text-zinc-400",
          actionButton:
            "group-[.toaster]:bg-zinc-100 group-[.toaster]:text-zinc-900",
          cancelButton:
            "group-[.toaster]:bg-zinc-800 group-[.toaster]:text-zinc-400",
          error:
            "group-[.toaster]:border-red-500/50 group-[.toaster]:text-red-200",
          success:
            "group-[.toaster]:border-emerald-500/50 group-[.toaster]:text-emerald-200",
        },
      }}
      position="top-right"
      richColors
      {...props}
    />
  );
};

export { Toaster };
