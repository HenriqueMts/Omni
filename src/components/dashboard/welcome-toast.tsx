"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

export function WelcomeToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (searchParams.get("welcome") !== "1") return;
    toast.success("Login realizado com sucesso!", {
      description: "Bem-vindo de volta.",
    });
    router.replace(pathname ?? "/dashboard", { scroll: false });
  }, [searchParams, router, pathname]);

  return null;
}
