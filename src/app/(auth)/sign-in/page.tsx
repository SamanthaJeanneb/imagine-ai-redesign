"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { SignInForm } from "@/components/features/onboarding/sign-in-form";
import { fade } from "@/styles/motion";

/**
 * Sign in. Form on the left, brand panel on the right. Any of the three ways in
 * starts onboarding; the mock does not check anything.
 */
export default function SignInPage() {
  const router = useRouter();
  const [pending, start] = useTransition();

  function enter() {
    start(() => {
      router.push("/onboarding/organization");
    });
  }

  return (
    <div className="grid min-h-svh w-full min-w-0 flex-1 overflow-x-clip bg-imagine-surface md:grid-cols-[1fr_minmax(0,42%)]">
      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={fade.slow}
        className="flex flex-col px-l py-xl md:items-center md:justify-center md:px-xl md:py-section"
      >
        <div className="flex w-full max-w-96 flex-col gap-xxl">
          <span
            role="img"
            aria-label="Imagine AI"
            className="block aspect-[138/43] w-28 bg-imagine-foreground mask-[url(/brand/imagine-logo.png)] mask-contain mask-center mask-no-repeat md:hidden"
          />
          <SignInForm
            pending={pending}
            onGoogle={enter}
            onX={enter}
            onEmail={enter}
          />
        </div>
      </motion.main>
      <div className="relative hidden overflow-hidden rounded-l-surface md:block">
        <Image
          src="/brand/sign-in-graphic.png"
          alt=""
          fill
          sizes="42vw"
          className="object-cover"
        />
      </div>
    </div>
  );
}
