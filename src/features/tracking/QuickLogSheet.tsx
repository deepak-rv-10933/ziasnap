"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Microphone, MicrophoneSlash } from "@phosphor-icons/react";
import { BottomSheet } from "@/components/feedback/BottomSheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MealTypeSelector } from "@/components/forms/MealTypeSelector";
import { parseQuickLog } from "@/lib/utils/quick-log-parser";
import { buildFoodItemFromCatalog } from "@/lib/utils/food-item";
import { mealTypeFromHour } from "@/lib/utils/date";
import { sumNutrition } from "@/types/nutrition";
import { useQuickLog } from "@/hooks/useQuickLog";
import type { MealType } from "@/types";

/* Minimal typing for the Web Speech API (not in TypeScript's DOM lib everywhere). */
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function speechRecognition(): SpeechRecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as Window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

const noopSubscribe = () => () => {};

export function QuickLogSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [text, setText] = useState("");
  const [mealType, setMealType] = useState<MealType>(() => mealTypeFromHour(new Date().getHours()));
  const [listening, setListening] = useState(false);
  // Hydration-safe feature check: false on the server, real answer in the browser.
  const canListen = useSyncExternalStore(
    noopSubscribe,
    () => Boolean(speechRecognition()),
    () => false,
  );
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const { log, isLogging } = useQuickLog();

  useEffect(() => () => recognitionRef.current?.stop(), []);

  const parsed = useMemo(() => parseQuickLog(text), [text]);
  const items = useMemo(
    () =>
      parsed.items.map(({ catalogFood, quantity }) =>
        buildFoodItemFromCatalog(catalogFood, { quantity, confidence: "high", isUserAdded: true }),
      ),
    [parsed],
  );
  const total = sumNutrition(items.map((item) => item.nutrition));

  const toggleListening = () => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const Recognition = speechRecognition();
    if (!Recognition) return;
    const recognition = new Recognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ");
      setText((current) => (current ? `${current}, ${transcript}` : transcript));
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  };

  const handleLog = async () => {
    await log(items.length === 1 ? items[0].name : `${items.length} items`, items, mealType);
    setText("");
    onOpenChange(false);
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Quick log"
      description={canListen ? "Type or say what you ate, like “2 idli, sambar and coffee”." : "Type what you ate, like “2 idli, sambar and coffee”."}
    >
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="2 idli, sambar and coffee"
            rows={2}
            aria-label="What did you eat?"
            className="pr-12"
          />
          {canListen ? (
            <Button
              type="button"
              size="icon"
              variant={listening ? "default" : "outline"}
              onClick={toggleListening}
              className="absolute right-2 top-2"
              aria-label={listening ? "Stop listening" : "Say what you ate"}
              aria-pressed={listening}
            >
              {listening ? <MicrophoneSlash className="size-4" /> : <Microphone className="size-4" />}
            </Button>
          ) : null}
        </div>

        {items.length > 0 ? (
          <ul className="flex flex-col divide-y divide-border/70 rounded-2xl border border-border/70 bg-card">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-foreground">
                  {item.name} <span className="text-muted-foreground">· {item.portion.label}</span>
                </span>
                <span className="tabular-nums text-muted-foreground">{Math.round(item.nutrition.calories)} kcal</span>
              </li>
            ))}
            <li className="flex items-center justify-between px-4 py-2.5 text-sm font-semibold">
              <span>Total</span>
              <span className="tabular-nums">
                {Math.round(total.calories)} kcal · {Math.round(total.proteinG)}g protein
              </span>
            </li>
          </ul>
        ) : null}
        {parsed.unmatched.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            Not in the food list yet: {parsed.unmatched.join(", ")}. Snap a photo to have Zia estimate it.
          </p>
        ) : null}

        <MealTypeSelector value={mealType} onChange={setMealType} />
        <Button type="button" size="lg" onClick={handleLog} disabled={items.length === 0 || isLogging}>
          {isLogging ? "Logging…" : items.length > 0 ? `Log ${Math.round(total.calories)} kcal` : "Log meal"}
        </Button>
      </div>
    </BottomSheet>
  );
}
