"use client";

import { cn } from "cn";
import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { createContext, type ReactNode, useContext, useState } from "react";

import { useWorkspaceFiles } from "@/components/layout/workspace-files";
import {
  COMPACT_QUERY,
  MOBILE_QUERY,
  useMediaQuery,
} from "@/lib/use-media-query";
import { fade } from "@/styles/motion";

interface WorkspaceChromeState {
  /** A phone: the rail is a sheet and the chat fills the surface. */
  isMobile: boolean;
  /** Too narrow to hold the page and a column of its own side by side. */
  isCompact: boolean;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  chatOverlayOpen: boolean;
  setChatOverlayOpen: (open: boolean) => void;
  /** Where a page's own sidebar goes, beside the page. */
  asideHost: HTMLElement | null;
  setAsideHost: (host: HTMLElement | null) => void;
}

const WorkspaceChromeContext = createContext<WorkspaceChromeState | null>(null);

export function useWorkspaceChrome(): WorkspaceChromeState {
  const context = useContext(WorkspaceChromeContext);
  if (context === null) {
    throw new Error(
      "useWorkspaceChrome must be used inside WorkspaceChromeProvider",
    );
  }
  return context;
}

/**
 * The frame around the page: the rail, the phone's nav sheet, the overlaid
 * chat, and the slot a page's own sidebar portals into.
 */
export function WorkspaceChromeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { panel } = useWorkspaceFiles();
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const isCompact = useMediaQuery(COMPACT_QUERY);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [chatOverlayOpen, setChatOverlayOpen] = useState(false);
  // A ref callback into state, so the page can portal into the slot once it
  // exists.
  const [asideHost, setAsideHost] = useState<HTMLElement | null>(null);
  const [railBefore, setRailBefore] = useState(false);

  // Frame and route changes reset what they made room for. Adjusted during
  // render against the last seen value, so there is no frame in between.
  const [seenCompact, setSeenCompact] = useState(isCompact);
  if (isCompact !== seenCompact) {
    setSeenCompact(isCompact);
    if (isCompact) setCollapsed(true);
    else setChatOverlayOpen(false);
  }
  const [seenMobile, setSeenMobile] = useState(isMobile);
  if (isMobile !== seenMobile) {
    setSeenMobile(isMobile);
    if (!isMobile) setMobileNavOpen(false);
  }
  const [seenPathname, setSeenPathname] = useState(pathname);
  if (pathname !== seenPathname) {
    setSeenPathname(pathname);
    setMobileNavOpen(false);
    setChatOverlayOpen(false);
  }

  // The calendar and the files panel both need the full width, so either can
  // tuck the rail away. They share one memory of how the reader had it, taken
  // on the way in and given back only once neither still wants the width: with
  // a memory each, leaving the calendar with the files panel open would hand
  // the panel the calendar's own collapsed rail and leave it stuck shut.
  const railTaken = pathname.startsWith("/calendar") || panel === "files";
  const [seenRailTaken, setSeenRailTaken] = useState(railTaken);
  if (railTaken !== seenRailTaken) {
    setSeenRailTaken(railTaken);
    if (railTaken) {
      setRailBefore(collapsed);
      setCollapsed(true);
    } else {
      setCollapsed(railBefore);
    }
  }

  return (
    <WorkspaceChromeContext
      value={{
        isMobile,
        isCompact,
        collapsed,
        setCollapsed,
        mobileNavOpen,
        setMobileNavOpen,
        chatOverlayOpen,
        setChatOverlayOpen,
        asideHost,
        setAsideHost,
      }}
    >
      {children}
    </WorkspaceChromeContext>
  );
}

/** The rail, as a sheet over the page on a phone and a column above it. */
export function WorkspaceNavSheet({ children }: { children: ReactNode }) {
  const { isMobile, mobileNavOpen, setMobileNavOpen } = useWorkspaceChrome();
  const asSheet = isMobile && mobileNavOpen;
  return (
    <div
      className={cn(
        asSheet
          ? "fixed inset-0 z-50 flex bg-imagine-foreground/10"
          : "hidden h-full md:flex",
      )}
      onClick={
        asSheet
          ? () => {
              setMobileNavOpen(false);
            }
          : undefined
      }
    >
      <div
        className="h-full"
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * The slot a page's own sidebar portals into. `contents` on wide frames so it
 * is a flex item of the shell's row. Hidden below `xl` before JS hydrates, so
 * a third column cannot crush the page while the window is still being
 * measured.
 */
export function WorkspacePageAsideSlot() {
  const { setAsideHost } = useWorkspaceChrome();
  return <div ref={setAsideHost} className="hidden xl:contents" />;
}

/** What an overlaid column or panel sits on, dismissed by a press outside. */
export function WorkspaceScrim({
  onDismiss,
  children,
}: {
  onDismiss: () => void;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={fade.fast}
      className="absolute inset-0 z-40 flex justify-end bg-imagine-foreground/10"
      onClick={onDismiss}
    >
      <div
        className="flex h-full max-w-full"
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        {children}
      </div>
    </motion.div>
  );
}
