import Link from "next/link";
import { Camera, CheckCircle, PencilSimple } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    icon: Camera,
    title: "Photograph your plate",
    body: "Shoot from above in good light, with the whole plate in frame: thali, dosa, a bowl of rice and dal, anything.",
  },
  {
    icon: PencilSimple,
    title: "Check Zia's estimate",
    body: "Zia names each dish and guesses the portion. Fix anything it got wrong (2 idlis, not 3; less oil) before saving.",
  },
  {
    icon: CheckCircle,
    title: "Confirm and you're tracking",
    body: "The meal counts toward today's calories and protein, and your history and insights start building.",
  },
];

/** Shown on Home until the user has logged their first meal. */
export function FirstSnapGuide() {
  return (
    <section className="rounded-3xl border border-border/70 bg-card p-5 sm:p-6" aria-labelledby="first-snap-title">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-tamarind dark:text-brand-turmeric">
        Your first snap
      </p>
      <h2 id="first-snap-title" className="mt-1 font-display text-xl font-semibold tracking-tight text-foreground">
        Log a meal in about 20 seconds
      </h2>
      <ol className="mt-5 flex flex-col gap-4">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-turmeric-soft text-brand-tamarind dark:text-brand-turmeric">
              <step.icon className="size-4.5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                <span className="sr-only">Step {index + 1}: </span>
                {step.title}
              </p>
              <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <Button render={<Link href="/snap" />} nativeButton={false} size="lg" className="mt-6 w-full sm:w-auto">
        <Camera className="size-4" />
        Snap your first meal
      </Button>
    </section>
  );
}
