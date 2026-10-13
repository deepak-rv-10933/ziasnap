"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowCounterClockwise, Sparkle, ThumbsDown, ThumbsUp } from "@phosphor-icons/react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CameraCapture } from "@/components/capture/CameraCapture";
import { ImageUpload } from "@/components/capture/ImageUpload";
import { ImagePreview } from "@/components/capture/ImagePreview";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Button } from "@/components/ui/button";
import { ZiaWorking } from "@/features/coach/ZiaWorking";
import { runCoach } from "@/lib/api/coach";
import { downscaleImageDataUrl } from "@/lib/utils/file";
import { generateId } from "@/lib/utils/id";
import { useQuickLog } from "@/hooks/useQuickLog";
import type { FoodItem, MenuPick } from "@/types";

/** A menu pick, logged as one serving and labelled as Zia's estimate. */
function pickToItem(pick: MenuPick): FoodItem {
  return {
    id: generateId("food"),
    name: pick.dish,
    portion: { quantity: 1, unit: "serving", label: "1 restaurant serving" },
    nutrition: pick.nutrition,
    perUnitNutrition: pick.nutrition,
    confidence: "medium",
    preparationNote: pick.tip,
    isUserAdded: false,
    isEdited: false,
  };
}

/** Eating-out mode: photograph a restaurant menu, get the best picks for what's left today. */
export default function EatingOutPage() {
  const [menuImage, setMenuImage] = useState<string | null>(null);
  const { log, isLogging } = useQuickLog();
  const advice = useMutation({
    mutationFn: async (image: string) => runCoach("menu", { imageDataUrl: await downscaleImageDataUrl(image, 1800, 0.85) }),
  });

  const reset = () => {
    setMenuImage(null);
    advice.reset();
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Eating out" subtitle="Snap the menu. Zia picks what fits the rest of your day." backHref="/recommendations" />

      {!menuImage ? (
        <div className="flex flex-col gap-4">
          <CameraCapture onCapture={setMenuImage} />
          <ImageUpload onCapture={setMenuImage} />
          <p className="text-center text-xs text-muted-foreground">Works best with one page of the menu, flat and in good light.</p>
        </div>
      ) : (
        <>
          <div className="w-32">
            <ImagePreview src={menuImage} />
          </div>

          {advice.isIdle ? (
            <div className="flex gap-2.5">
              <Button type="button" variant="outline" className="flex-1" onClick={reset}>
                Retake
              </Button>
              <Button type="button" className="flex-1" onClick={() => advice.mutate(menuImage)}>
                <Sparkle weight="fill" className="size-4" />
                Find my best picks
              </Button>
            </div>
          ) : advice.isPending ? (
            <ZiaWorking label="Zia is reading the menu…" />
          ) : advice.isError ? (
            <ErrorState title="Zia couldn't read that menu" description={advice.error.message} onRetry={() => advice.mutate(menuImage)} />
          ) : (
            <>
              {advice.data.picks.length === 0 ? (
                <p className="text-sm text-muted-foreground">{advice.data.notes ?? "Zia didn't find dishes in that photo. Try a clearer shot of the menu."}</p>
              ) : (
                <section aria-labelledby="picks-title">
                  <h2 id="picks-title" className="mb-2.5 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <ThumbsUp weight="fill" className="size-4 text-brand-leaf" aria-hidden="true" />
                    Good picks for you
                  </h2>
                  <ul className="flex flex-col gap-2.5">
                    {advice.data.picks.map((pick) => (
                      <li key={pick.dish} className="rounded-2xl border border-border/70 bg-card p-4">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-foreground">{pick.dish}</p>
                          <p className="shrink-0 text-right text-sm tabular-nums text-foreground">
                            ~{pick.nutrition.calories} kcal
                            <span className="block text-xs text-brand-leaf">{pick.nutrition.proteinG}g protein</span>
                          </p>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{pick.why}</p>
                        {pick.tip ? <p className="mt-1.5 text-xs font-medium text-foreground">Tip: {pick.tip}</p> : null}
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="mt-3"
                          disabled={isLogging}
                          onClick={() => log(pick.dish, [pickToItem(pick)])}
                        >
                          Log this
                        </Button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {advice.data.goEasy.length > 0 ? (
                <section aria-labelledby="go-easy-title">
                  <h2 id="go-easy-title" className="mb-2.5 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <ThumbsDown weight="fill" className="size-4 text-muted-foreground" aria-hidden="true" />
                    Go easy on
                  </h2>
                  <ul className="flex flex-col gap-2">
                    {advice.data.goEasy.map((item) => (
                      <li key={item.dish} className="rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm">
                        <span className="font-semibold text-foreground">{item.dish}.</span> <span className="text-muted-foreground">{item.why}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <p className="text-xs text-muted-foreground">Restaurant portions and oil vary a lot, so these are rough AI estimates.</p>
              <Button type="button" variant="ghost" onClick={reset} className="self-start">
                <ArrowCounterClockwise className="size-4" />
                Try another menu
              </Button>
            </>
          )}
        </>
      )}
    </div>
  );
}
