"use client";

import { useCallback, useRef, useState } from "react";
import type React from "react";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

function getCroppedBlob(
  image: HTMLImageElement,
  crop: PixelCrop,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Canvas 2d não disponível"));
      return;
    }
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height,
    );
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Falha ao gerar imagem"));
      },
      "image/jpeg",
      0.9,
    );
  });
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onCropComplete: (blob: Blob) => Promise<void>;
};

export function AvatarCropModal({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
}: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [loading, setLoading] = useState(false);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  }, []);

  async function handleConfirm() {
    if (!completedCrop || !imgRef.current) return;
    setLoading(true);
    try {
      const blob = await getCroppedBlob(imgRef.current, completedCrop);
      await onCropComplete(blob);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      alert("Erro ao processar a imagem.");
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    setCrop(undefined);
    setCompletedCrop(undefined);
    onOpenChange(false);
  }

  const hasImage = open && imageSrc && imageSrc.length > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleCancel()}>
      <DialogContent className="max-w-md border-zinc-800 bg-zinc-900 text-zinc-50 [&_.ReactCrop__crop-selection]:rounded-full">
        <DialogHeader>
          <DialogTitle>Ajustar foto</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-zinc-400 -mt-2">
          Arraste para reposicionar. A área circular será sua foto de perfil.
        </p>
        <div className="flex justify-center min-h-[280px] bg-zinc-950 rounded-lg overflow-hidden">
          {hasImage && (
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)}
            aspect={1}
            circularCrop
            className="max-h-[300px]"
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Preview"
              onLoad={onImageLoad}
              className="max-h-[300px] w-auto"
              style={{ maxWidth: "100%" }}
            />
          </ReactCrop>
          )}
        </div>
        <DialogFooter className="gap-3 sm:gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="border-zinc-700"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!completedCrop || loading}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {loading ? "Salvando…" : "Aplicar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
