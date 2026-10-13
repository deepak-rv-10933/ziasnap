"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Route templates re-mount on every navigation, so wrapping a page in this
 * gives each screen a short rise-and-fade in. Quick enough (240ms) to never
 * stand between the user and the content; off under reduced motion.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
