"use client";

import { Check, Question } from "@phosphor-icons/react";
import { useMealCaptureStore } from "@/stores/useMealCaptureStore";
import { cn } from "@/lib/utils";

/**
 * Zia's follow-up questions about the items it was least sure of. One tap
 * swaps in Zia's own recalculated item, so the user never edits numbers.
 */
export function SmartConfirmation() {
  const questions = useMealCaptureStore((state) => state.questions);
  const answers = useMealCaptureStore((state) => state.answers);
  const items = useMealCaptureStore((state) => state.items);
  const answerQuestion = useMealCaptureStore((state) => state.answerQuestion);

  // A question about an item the user has since removed no longer applies.
  const open = questions.filter((question) => items.some((item) => item.id === question.itemId));
  if (open.length === 0) return null;
  const answeredCount = open.filter((question) => answers[question.id]).length;

  return (
    <section
      aria-labelledby="smart-confirm-title"
      className="rounded-2xl border border-brand-turmeric/40 bg-brand-turmeric-soft/60 p-4"
    >
      <h2 id="smart-confirm-title" className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <Question weight="fill" className="size-4 text-brand-tamarind dark:text-brand-turmeric" aria-hidden="true" />
        {answeredCount === open.length
          ? "Thanks, Zia updated the estimate"
          : `Zia has ${open.length === 1 ? "a quick question" : `${open.length} quick questions`}`}
      </h2>
      <div className="mt-3 flex flex-col gap-3.5">
        {open.map((question) => (
          <fieldset key={question.id}>
            <legend className="mb-2 text-sm text-foreground">{question.question}</legend>
            <div className="flex flex-wrap gap-2">
              {question.options.map((option) => {
                const chosen = answers[question.id] === option.label;
                return (
                  <button
                    key={option.label}
                    type="button"
                    aria-pressed={chosen}
                    onClick={() => answerQuestion(question.id, option.label)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-turmeric/50",
                      chosen
                        ? "border-brand-tamarind bg-brand-tamarind text-white dark:border-brand-turmeric dark:bg-brand-turmeric dark:text-[#1a1206]"
                        : "border-border bg-card text-foreground hover:bg-muted/60",
                    )}
                  >
                    {chosen ? <Check weight="bold" className="size-3.5" aria-hidden="true" /> : null}
                    {option.label}
                    {option.isCurrent && !answers[question.id] ? (
                      <span className="rounded-full bg-brand-turmeric-soft px-1.5 text-[0.625rem] font-semibold uppercase tracking-wide text-brand-tamarind dark:text-brand-turmeric">
                        Zia&apos;s guess
                      </span>
                    ) : null}
                    <span className={cn("tabular-nums", chosen ? "opacity-80" : "text-muted-foreground")}>
                      {Math.round(option.item.nutrition.calories)} kcal
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
    </section>
  );
}
