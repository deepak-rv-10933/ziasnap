"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api/client";
import { isRealBackendActive, signOut } from "@/lib/catalyst/web-sdk";

const CONFIRM_WORD = "DELETE";

export function DeleteAccountDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteAccount();
      queryClient.clear();
      if (isRealBackendActive()) {
        // The account no longer exists; signing out clears the leftover session.
        // Full reload on purpose: drops every in-memory trace of the deleted account.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        await signOut().catch(() => window.location.assign("/"));
        return;
      }
      toast.success("Demo data reset");
      onOpenChange(false);
      router.push("/");
    } catch {
      toast.error("Couldn't finish deleting your account. Please try again.");
      setDeleting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (deleting) return;
        if (!next) setConfirmText("");
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete your account?</DialogTitle>
          <DialogDescription>
            This permanently removes your profile, every meal you&apos;ve logged, and your sign-in. It can&apos;t be undone —
            export your data first if you want a copy.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="confirm-delete">Type {CONFIRM_WORD} to confirm</Label>
          <Input
            id="confirm-delete"
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
          />
        </div>
        <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={deleting}>
            Keep my account
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={confirmText.trim() !== CONFIRM_WORD || deleting}
          >
            {deleting ? "Deleting…" : "Delete permanently"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
