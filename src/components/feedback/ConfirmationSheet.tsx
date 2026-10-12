"use client";

import { Button } from "@/components/ui/button";
import { BottomSheet } from "./BottomSheet";

interface ConfirmationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}

export function ConfirmationSheet({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
}: ConfirmationSheetProps) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={title} description={description}>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row-reverse">
        <Button
          type="button"
          variant={destructive ? "destructive" : "default"}
          className="flex-1"
          onClick={() => {
            onConfirm();
            onOpenChange(false);
          }}
        >
          {confirmLabel}
        </Button>
        <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
          {cancelLabel}
        </Button>
      </div>
    </BottomSheet>
  );
}
