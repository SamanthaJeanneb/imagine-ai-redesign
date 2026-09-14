"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { CloudBackground } from "@/components/features/onboarding/cloud-background";
import { SignInForm } from "@/components/features/onboarding/sign-in-form";
import { ThinkerPanel } from "@/components/features/onboarding/thinker-panel";
import { Wordmark } from "@/components/ui/brand-mark";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { fade, spring } from "@/styles/motion";

/**
 * Sign in, second take: one floating card over a rose sky of drifting clouds. The
 * form at left, the thinker among clouds at right. Any of the three ways in
 * starts onboarding; the mock does not check anything.
 */
export default function SignIn2Page() {
  const router = useRouter();
  const [pending, start] = useTransition();

  function enter() {
    start(() => {
      router.push("/onboarding/organization");
    });
  }

  return (
    <div className="relative flex min-h-svh w-full min-w-0 flex-1 items-center justify-center overflow-x-clip bg-imagine-background p-l md:p-xl">
      <div aria-hidden="true" className="absolute inset-0">
        <CloudBackground />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ ...spring.soft, opacity: fade.slow }}
        className="relative grid w-full max-w-5xl overflow-hidden rounded-surface bg-imagine-surface/75 shadow-floating backdrop-blur-2xl md:min-h-[40rem] md:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] dark:bg-imagine-surface/70"
      >
        <main className="flex flex-col gap-xxl p-xl md:p-xxl">
          <div className="flex items-center justify-between">
            <Wordmark className="w-24 text-imagine-foreground" />
            <div className="md:hidden">
              <ThemeToggle />
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-center py-l">
            <SignInForm
              pending={pending}
              onGoogle={enter}
              onX={enter}
              onEmail={enter}
              className="max-w-none"
            />
          </div>
        </main>

        <ThinkerPanel
          className="hidden md:flex"
          corner={
            <div className="rounded-full bg-imagine-surface/70 p-xxs shadow-control backdrop-blur-md">
              <ThemeToggle />
            </div>
          }
        />
      </motion.div>
    </div>
  );
}
