"use client";

import type { ReactNode } from "react";

import { PageTransition } from "@/components/motion/page-transition";

/** Remounts per route, so each page fades and slides in. */
export default function WorkspaceTemplate({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <PageTransition className="flex min-h-0 flex-1 flex-col">
      {children}
    </PageTransition>
  );
}
