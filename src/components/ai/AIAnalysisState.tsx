"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MealPhoto } from "@/components/meals/MealPhoto";

const STATUS_MESSAGES = ["Identifying ingredients…", "Estimating portions…", "Calculating nutrition…"];

interface AIAnalysisStateProps {
  imageSrc: string;
}

export function AIAnalysisState({ imageSrc }: AIAnalysisStateProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((index) => (index + 1) % STATUS_MESSAGES.length);
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl">
        <MealPhoto src={imageSrc} alt="Your captured meal, being analyzed" aspect="video" className="w-full" />
        {!reducedMotion ? (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 h-1/3 bg-gradient-to-b from-transparent via-brand-turmeric/40 to-transparent"
            initial={{ top: "-40%" }}
            animate={{ top: ["-40%", "110%"] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
            style={{ position: "absolute" }}
          />
        ) : (
          <div className="absolute inset-0 animate-pulse bg-brand-turmeric/10" aria-hidden="true" />
        )}
      </div>

      <p className="mt-6 text-sm font-medium text-muted-foreground" role="status" aria-live="polite">
        {STATUS_MESSAGES[messageIndex]}
      </p>
      <p className="mt-1 text-xs text-muted-foreground/70">Zia is reading your plate</p>
    </div>
  );
}
