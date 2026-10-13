"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MealDetail } from "./MealDetail";

/** Static-site friendly meal route: /meal?id=… (a static export can't serve /meal/[id]). */
function MealFromQuery() {
  const id = useSearchParams().get("id") ?? "";
  return <MealDetail key={id} id={id} />;
}

export default function MealPage() {
  return (
    <Suspense fallback={null}>
      <MealFromQuery />
    </Suspense>
  );
}
