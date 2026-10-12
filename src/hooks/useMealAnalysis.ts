import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useMealCaptureStore } from "@/stores/useMealCaptureStore";

export function useAnalyzeMealMutation() {
  const analysisSucceeded = useMealCaptureStore((state) => state.analysisSucceeded);
  const analysisFailed = useMealCaptureStore((state) => state.analysisFailed);
  const startAnalyzing = useMealCaptureStore((state) => state.startAnalyzing);

  return useMutation({
    mutationFn: api.analyzeMeal,
    onMutate: () => startAnalyzing(),
    onSuccess: (result) => analysisSucceeded(result),
    onError: (error: Error) => analysisFailed(error.message || "Analysis failed. Please try again."),
  });
}
