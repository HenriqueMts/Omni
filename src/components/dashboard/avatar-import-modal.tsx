"use client";

import { useRef, useState } from "react";
import { Upload, Image } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const AVATAR_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const AVATAR_MAX_MB = 5;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileSelected: (file: File) => void;
};

export function AvatarImportModal({
  open,
  onOpenChange,
  onFileSelected,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFile(file: File | null) {
    if (!file) return;
    if (file.size > AVATAR_MAX_MB * 1024 * 1024) {
      alert(`Arquivo deve ter no máximo ${AVATAR_MAX_MB} MB.`);
      return;
    }
    if (!AVATAR_ACCEPT.split(",").some((t) => file.type === t)) {
      alert("Formato inválido. Use JPEG, PNG, WebP ou GIF.");
      return;
    }
    onFileSelected(file);
    onOpenChange(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    handleFile(file ?? null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file ?? null);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave() {
    setDragOver(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm border-zinc-800 bg-zinc-900 text-zinc-50">
        <DialogHeader>
          <DialogTitle>Importar foto</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Selecione uma imagem do seu computador para usar como foto de perfil
          </DialogDescription>
        </DialogHeader>
        <input
          ref={fileInputRef}
          type="file"
          accept={AVATAR_ACCEPT}
          className="hidden"
          aria-label="Selecionar imagem"
          onChange={handleChange}
        />
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-12 px-6 cursor-pointer transition-colors ${
            dragOver
              ? "border-emerald-500 bg-emerald-500/10"
              : "border-zinc-700 hover:border-zinc-600 bg-zinc-950/50"
          }`}
        >
          <Image className="h-12 w-12 text-zinc-500 mb-4" />
          <p className="text-zinc-300 text-sm text-center mb-1">
            Clique ou arraste uma imagem aqui
          </p>
          <p className="text-zinc-500 text-xs">
            JPEG, PNG, WebP ou GIF — até {AVATAR_MAX_MB} MB
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4 border-zinc-700 text-zinc-300"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            <Upload className="h-4 w-4 mr-2" />
            Selecionar arquivo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
