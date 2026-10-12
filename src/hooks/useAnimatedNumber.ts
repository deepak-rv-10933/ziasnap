import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";

/** Animates a number smoothly toward `value` — used for the big calorie/macro
 * figures so they count up/down instead of jumping when data changes. */
export function useAnimatedNumber(value: number, options?: { duration?: number }): number {
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (reducedMotion.current) {
      setDisplay(value);
      previous.current = value;
      return;
    }
    const controls = animate(previous.current, value, {
      duration: options?.duration ?? 0.8,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setDisplay(latest),
      onComplete: () => {
        previous.current = value;
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return display;
}
