"use client";

import { Button } from "@/components/ui/button";

interface CaptureControlsProps {
  onRetake: () => void;
  onCancel: () => void;
  onAnalyze: () => void;
  analyzing?: boolean;
}

export function CaptureControls({ onRetake, onCancel, onAnalyze, analyzing }: CaptureControlsProps) {
  return (
    <div className="flex items-center gap-2.5">
      <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={analyzing}>
        Cancel
      </Button>
      <Button type="button" variant="outline" className="flex-1" onClick={onRetake} disabled={analyzing}>
        Retake
      </Button>
      <Button type="button" className="flex-1" onClick={onAnalyze} disabled={analyzing}>
        {analyzing ? "Analyzing…" : "Analyze"}
      </Button>
    </div>
  );
}
