"use client";

import { useRef } from "react";
import { Camera } from "@phosphor-icons/react";
import { readFileAsDataUrl } from "@/lib/utils/file";

interface CameraCaptureProps {
  onCapture: (dataUrl: string) => void;
}

export function CameraCapture({ onCapture }: CameraCaptureProps) {
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
        className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-brand-turmeric/40 bg-brand-turmeric-soft/40 text-brand-tamarind transition-colors hover:bg-brand-turmeric-soft/70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-turmeric/30 dark:text-brand-turmeric"
      >
        <span className="flex size-20 items-center justify-center rounded-full bg-brand-turmeric text-[#211c16] motion-safe:animate-[breathe_3.2s_ease-in-out_infinite]">
          <Camera weight="fill" className="size-9" />
        </span>
        <span className="text-sm font-semibold">Tap to take a photo</span>
        <span className="max-w-[70%] text-center text-xs opacity-80">
          Fit the whole plate in frame for the most accurate estimate
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        className="sr-only"
        aria-label="Take a photo of your meal"
      />
    </>
  );
}
