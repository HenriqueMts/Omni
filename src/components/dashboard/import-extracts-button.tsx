"use client";

import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useImportStatement } from "@/contexts/import-statement-context";

export function ImportExtractsButton() {
  const { setOpen } = useImportStatement();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setOpen(true)}
      className="h-9 border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
    >
      <Upload className="h-4 w-4 mr-1.5" />
      Importar extratos
    </Button>
  );
}
