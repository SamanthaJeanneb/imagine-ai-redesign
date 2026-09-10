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
    <div className="grid flex-1 bg-imagine-surface md:grid-cols-[1fr_minmax(0,42%)]">
      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={fade.slow}
        className="flex items-center justify-center px-xl py-section"
      >
        <SignInForm
          pending={pending}
          onGoogle={enter}
          onX={enter}
          onEmail={enter}
        />
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
