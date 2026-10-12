"use client";

import { useRef } from "react";
import { Image as ImageIcon } from "@phosphor-icons/react";
import { readFileAsDataUrl } from "@/lib/utils/file";

interface ImageUploadProps {
  onCapture: (dataUrl: string) => void;
}

export function ImageUpload({ onCapture }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    onCapture(dataUrl);
    event.target.value = "";
  };

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-turmeric/50"
      >
        <ImageIcon className="size-5" />
        Upload from gallery
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="sr-only"
        aria-label="Upload a photo of your meal"
      />
    </>
  );
}
