"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { CameraCapture } from "@/components/capture/CameraCapture";
import { ImageUpload } from "@/components/capture/ImageUpload";
import { ImagePreview } from "@/components/capture/ImagePreview";
import { CaptureControls } from "@/components/capture/CaptureControls";
import { AIAnalysisState } from "@/components/ai/AIAnalysisState";
import { AIConfidenceIndicator } from "@/components/ai/AIConfidenceIndicator";
import { FoodItemEditor } from "@/components/meals/FoodItemEditor";
import { NutritionSummary } from "@/components/meals/NutritionSummary";
import { MealTypeSelector } from "@/components/forms/MealTypeSelector";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "@phosphor-icons/react";
import { AddFoodSheet } from "@/features/meal-analysis/AddFoodSheet";
import { useMealCaptureStore } from "@/stores/useMealCaptureStore";
import { useAnalyzeMealMutation } from "@/hooks/useMealAnalysis";
import { useConfirmMealMutation } from "@/hooks/useMealConfirm";
import { sumNutrition } from "@/types/nutrition";
import { downscaleImageDataUrl } from "@/lib/utils/file";
import { LOGIN_PATH, SIGNUP_PATH, hasRealApi, isRealBackendActive } from "@/lib/catalyst/web-sdk";
import { useIsGuest } from "@/components/auth/AuthGate";
import { clearPendingMeal, loadPendingMeal, savePendingMeal } from "@/lib/guest/pending-meal";

export default function SnapPage() {
  const router = useRouter();
  const isGuest = useIsGuest();
  const [addFoodOpen, setAddFoodOpen] = useState(false);
  const exitHref = isGuest ? "/" : "/home";

  const status = useMealCaptureStore((state) => state.status);
  const capturedImage = useMealCaptureStore((state) => state.capturedImage);
  const mealType = useMealCaptureStore((state) => state.mealType);
  const items = useMealCaptureStore((state) => state.items);
  const notes = useMealCaptureStore((state) => state.notes);
  const overallConfidence = useMealCaptureStore((state) => state.overallConfidence);
  const analysisNotes = useMealCaptureStore((state) => state.analysisNotes);
  const analysisId = useMealCaptureStore((state) => state.analysisId);
  const error = useMealCaptureStore((state) => state.error);

  const setCapturedImage = useMealCaptureStore((state) => state.setCapturedImage);
  const setMealType = useMealCaptureStore((state) => state.setMealType);
  const setNotes = useMealCaptureStore((state) => state.setNotes);
  const updateItem = useMealCaptureStore((state) => state.updateItem);
  const removeItem = useMealCaptureStore((state) => state.removeItem);
  const retake = useMealCaptureStore((state) => state.retake);
  const reset = useMealCaptureStore((state) => state.reset);
  const restore = useMealCaptureStore((state) => state.restore);

  const analyzeMeal = useAnalyzeMealMutation();
  const confirmMeal = useConfirmMealMutation();

  useEffect(() => {
    return () => {
      reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Signed in with a meal analyzed earlier as a guest: pick up where they left off.
  useEffect(() => {
    if (isGuest || !isRealBackendActive()) return;
    const pending = loadPendingMeal();
    if (pending) {
      restore(pending);
      toast.info("Here's the meal you snapped before signing up. Confirm to save it.");
    }
  }, [isGuest, restore]);

  const handleAnalyze = async () => {
    if (!capturedImage) return;
    const imageDataUrl = await downscaleImageDataUrl(capturedImage);
    analyzeMeal.mutate({ imageDataUrl, mealType, notes: notes || undefined, guest: isGuest });
  };

  const handleCancel = () => {
    clearPendingMeal();
    reset();
    router.push(exitHref);
  };

  const handleRetake = () => {
    clearPendingMeal();
    retake();
  };

  const totalNutrition = sumNutrition(items.map((item) => item.nutrition));

  /** Guest: keep the reviewed meal in this browser, then create the account. */
  const handleSaveAsGuest = async (destination: string) => {
    savePendingMeal({
      mealType,
      items,
      notes,
      analysisId: analysisId ?? undefined,
      overallConfidence: overallConfidence ?? undefined,
      analysisNotes: analysisNotes ?? undefined,
      imageDataUrl: capturedImage ? await downscaleImageDataUrl(capturedImage, 1200, 0.8) : undefined,
    });
    window.location.assign(destination);
  };

  const handleConfirm = () => {
    confirmMeal.mutate(
      {
        type: mealType,
        source: "photo",
        // Photos are never stored for real users, and the public demo's sample data is shared
        // between visitors — only a local mock build keeps the photo inline for the preview.
        ...(hasRealApi ? {} : { photoUrl: capturedImage ?? undefined }),
        items,
        notes: notes || undefined,
        analysisId: analysisId ?? undefined,
      },
      {
        onSuccess: () => {
          clearPendingMeal();
          toast.success("Meal added to today's log");
          reset();
          router.push("/home");
        },
        onError: () => toast.error("Couldn't save this meal. Please try again."),
      },
    );
  };

  return (
    <div>
      <PageHeader
        title={status === "idle" ? "Snap your meal" : "Your meal"}
        backHref={status === "idle" ? exitHref : undefined}
      />

      <AnimatePresence mode="wait">
        {status === "idle" ? (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-4"
          >
            {isGuest ? (
              <p className="rounded-2xl border border-brand-turmeric/40 bg-brand-turmeric-soft px-4 py-3 text-sm text-foreground">
                <span className="font-semibold">Try it free, no account needed.</span> Snap a meal and see what Zia
                finds. Sign up when you want to save it and track your day.
              </p>
            ) : null}
            <CameraCapture onCapture={setCapturedImage} />
            <ImageUpload onCapture={setCapturedImage} />
            <p className="text-center text-xs text-muted-foreground">
              Zia gives an AI estimate. You can review and adjust everything before it&apos;s saved.
            </p>
          </motion.div>
        ) : null}

        {(status === "captured" || status === "analyzing") && capturedImage ? (
          <motion.div
            key="captured"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-4"
          >
            {/* While analyzing, AIAnalysisState shows the photo itself (with the scan effect). */}
            {status === "captured" ? (
              <motion.div layoutId="meal-photo">
                <ImagePreview src={capturedImage} />
              </motion.div>
            ) : null}

            {status === "captured" ? (
              <>
                <MealTypeSelector value={mealType} onChange={setMealType} />
                <CaptureControls onRetake={handleRetake} onCancel={handleCancel} onAnalyze={handleAnalyze} />
              </>
            ) : (
              <AIAnalysisState imageSrc={capturedImage} />
            )}
          </motion.div>
        ) : null}

        {status === "error" ? (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ErrorState
              title="Analysis failed"
              description={error ?? "Something went wrong while reading your plate."}
              onRetry={handleAnalyze}
            />
          </motion.div>
        ) : null}

        {status === "analyzed" ? (
          <motion.div
            key="analyzed"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-4 pb-24"
          >
            <div className="flex items-center gap-3">
              {capturedImage ? (
                <motion.div layoutId="meal-photo" className="w-24 shrink-0">
                  <ImagePreview src={capturedImage} />
                </motion.div>
              ) : null}
              <div>
                <p className="font-display text-lg font-semibold text-foreground">
                  Zia found {items.length} item{items.length === 1 ? "" : "s"}
                </p>
                <p className="text-sm text-muted-foreground">Review and adjust anything before saving.</p>
              </div>
            </div>

            {overallConfidence ? <AIConfidenceIndicator confidence={overallConfidence} note={analysisNotes ?? undefined} /> : null}

            <MealTypeSelector value={mealType} onChange={setMealType} />

            <div className="flex flex-col gap-2.5">
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06, duration: 0.3 }}
                >
                  <FoodItemEditor item={item} onChange={updateItem} onRemove={removeItem} />
                </motion.div>
              ))}
            </div>

            <Button type="button" variant="outline" onClick={() => setAddFoodOpen(true)} className="justify-center gap-1.5">
              <Plus className="size-4" />
              Add food
            </Button>

            <div>
              <label htmlFor="meal-notes" className="mb-1.5 block text-sm font-medium text-foreground">
                Notes (optional)
              </label>
              <Textarea
                id="meal-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="e.g. extra spicy, shared this plate…"
                rows={2}
              />
            </div>

            <NutritionSummary nutrition={totalNutrition} />

            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-card/95 p-4 pb-[max(env(safe-area-inset-bottom),1rem)] backdrop-blur lg:sticky lg:rounded-2xl lg:border">
              {isGuest ? (
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    className="w-full"
                    size="lg"
                    onClick={() => handleSaveAsGuest(SIGNUP_PATH)}
                    disabled={items.length === 0}
                  >
                    Sign up to save this meal
                  </Button>
                  <button
                    type="button"
                    onClick={() => handleSaveAsGuest(LOGIN_PATH)}
                    className="text-center text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    Already have an account? Sign in
                  </button>
                </div>
              ) : (
                <Button
                  type="button"
                  className="w-full"
                  size="lg"
                  onClick={handleConfirm}
                  disabled={confirmMeal.isPending || items.length === 0}
                >
                  {confirmMeal.isPending ? "Saving…" : "Confirm Meal"}
                </Button>
              )}
            </div>

            <AddFoodSheet open={addFoodOpen} onOpenChange={setAddFoodOpen} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
