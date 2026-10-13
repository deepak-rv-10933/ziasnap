"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Leaf } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { FOOD_IMAGES } from "@/data/food-images";
import { LOGIN_PATH, SIGNUP_PATH, hasRealApi, isRealBackendActive, isSignedIn } from "@/lib/catalyst/web-sdk";
import { api } from "@/lib/api/client";
import { hasPendingMeal } from "@/lib/guest/pending-meal";

export default function WelcomePage() {
  const router = useRouter();

  // Catalyst's login redirects here; send a signed-in user on to their app.
  useEffect(() => {
    if (!isRealBackendActive()) return;
    let cancelled = false;
    (async () => {
      if (!(await isSignedIn()) || cancelled) return;
      const profile = await api.getProfile().catch(() => null);
      if (cancelled) return;
      if (!profile?.onboardingCompletedAt) router.replace("/onboarding/goal");
      else router.replace(hasPendingMeal() ? "/snap" : "/home");
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="relative h-[52dvh] min-h-72 w-full overflow-hidden sm:h-[46dvh]">
        <motion.img
          src={FOOD_IMAGES.heroMealPhoto}
          alt="A generously plated South Indian meal with dosa, sambar and chutneys"
          className="size-full object-cover"
          initial={{ scale: 1.08, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-between px-6 pb-10 pt-2 sm:pb-14">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mb-5 flex items-center gap-2"
          >
            <span className="flex size-9 items-center justify-center rounded-2xl bg-brand-turmeric text-[#1a1206]">
              <Leaf weight="fill" className="size-5" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight text-foreground">ZiaSnap</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl"
          >
            Snap your food.
            <br />
            Understand your nutrition.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 text-base leading-relaxed text-muted-foreground"
          >
            Photograph a meal and Zia estimates the dishes, portions and nutrition. It&apos;s built around real Indian
            and South Indian food, not a generic calorie database.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 flex flex-col gap-3"
        >
          {hasRealApi ? (
            <>
              {/* Catalyst's hosted pages live on this origin, outside the Next.js router. */}
              <Button render={<a href={SIGNUP_PATH} />} nativeButton={false} size="lg" className="w-full">
                Get started
              </Button>
              <Button render={<Link href="/snap" />} nativeButton={false} variant="outline" size="lg" className="w-full">
                Try a snap, no account needed
              </Button>
              <Button render={<a href={LOGIN_PATH} />} nativeButton={false} variant="ghost" size="lg" className="w-full">
                Sign in
              </Button>
              <Link
                href="/demo"
                className="text-center text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Or explore a demo account with sample data
              </Link>
            </>
          ) : (
            <>
              <Button render={<Link href="/onboarding/goal" />} nativeButton={false} size="lg" className="w-full">
                Get started
              </Button>
              <Button render={<Link href="/home" />} nativeButton={false} variant="ghost" size="lg" className="w-full">
                Explore the demo
              </Button>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
