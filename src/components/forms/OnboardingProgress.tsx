interface OnboardingProgressProps {
  step: number;
  totalSteps: number;
  label: string;
}

export function OnboardingProgress({ step, totalSteps, label }: OnboardingProgressProps) {
  return (
    <div className="mb-6">
      <div className="mb-2 flex gap-1.5">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div
            key={index}
            className={`h-1.5 flex-1 rounded-full ${index < step ? "bg-brand-turmeric" : "bg-muted"}`}
          />
        ))}
      </div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Step {step} of {totalSteps} · {label}
      </p>
    </div>
  );
}
