"use client";

import { cn } from "cn";
import { usePathname } from "next/navigation";
import { createContext, type ReactNode, useContext, useState } from "react";

import { useWorkspaceFiles } from "@/components/layout/workspace-files";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  COMPACT_QUERY,
  MOBILE_QUERY,
  useMediaQuery,
} from "@/lib/use-media-query";

/**
 * `DialogContent` is a centered panel; an overlaid column takes the whole
 * surface and anchors to an edge instead. It stays transparent to the pointer
 * so a press beside the column reaches the scrim under it.
 */
const OVERLAY_SURFACE =
  "pointer-events-none top-0 left-0 flex h-dvh w-full max-w-full translate-x-0 translate-y-0 gap-0 rounded-none bg-transparent p-0 text-inherit shadow-none data-open:zoom-in-100 data-closed:zoom-out-100 sm:max-w-full";

/**
 * The same, for an overlay that belongs to the page surface rather than the
 * viewport, so the rail beside it stays visible and reachable.
 */
const INSET_OVERLAY_SURFACE =
  "pointer-events-none absolute top-0 left-0 z-40 flex h-full w-full max-w-full translate-x-0 translate-y-0 gap-0 rounded-none bg-transparent p-0 text-inherit shadow-none data-open:zoom-in-100 data-closed:zoom-out-100 sm:max-w-full";

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
  /** The page surface, which an overlay covers instead of the whole viewport. */
  surfaceHost: HTMLElement | null;
  setSurfaceHost: (host: HTMLElement | null) => void;
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
  const { filesPanelOpen } = useWorkspaceFiles();
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const isCompact = useMediaQuery(COMPACT_QUERY);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [chatOverlayOpen, setChatOverlayOpen] = useState(false);
  // A ref callback into state, so the page can portal into the slot once it
  // exists.
  const [asideHost, setAsideHost] = useState<HTMLElement | null>(null);
  const [surfaceHost, setSurfaceHost] = useState<HTMLElement | null>(null);
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
  const railTaken = pathname.startsWith("/calendar") || filesPanelOpen;
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
        surfaceHost,
        setSurfaceHost,
      }}
    >
      {children}
    </WorkspaceChromeContext>
  );
}

/** The rail, as a sheet over the page on a phone and a column above it. */
export function WorkspaceNavSheet({ children }: { children: ReactNode }) {
  const { isMobile, mobileNavOpen, setMobileNavOpen } = useWorkspaceChrome();

  if (isMobile) {
    return (
      <Dialog open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <DialogContent
          overlayClassName="bg-imagine-foreground/10 supports-backdrop-filter:backdrop-blur-none"
          className={OVERLAY_SURFACE}
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">Navigation</DialogTitle>
          <div className="pointer-events-auto h-full max-w-full">
            {children}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="hidden h-full md:flex">
      <div className="h-full">{children}</div>
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

/**
 * What an overlaid column or panel sits on, dismissed by a press outside. The
 * panel itself takes the pointer back, so a press anywhere else reaches the
 * scrim under it and closes.
 */
/** The page surface an inset overlay covers, leaving the rail beside it. */
export function WorkspaceSurface({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { setSurfaceHost } = useWorkspaceChrome();
  return (
    <div ref={setSurfaceHost} className={className}>
      {children}
    </div>
  );
}

export function WorkspaceScrim({
  open,
  onOpenChange,
  label,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Names the overlay for assistive technology. */
  label: string;
  children: ReactNode;
}) {
  const { surfaceHost } = useWorkspaceChrome();
  return (
    // Not modal: the overlay belongs to the page surface, so the rail beside
    // it stays reachable, as it is when the column sits in the flow.
    <Dialog modal={false} open={open} onOpenChange={onOpenChange}>
      <DialogContent
        container={surfaceHost}
        overlayClassName="absolute z-40 bg-imagine-foreground/10 supports-backdrop-filter:backdrop-blur-none"
        className={cn(INSET_OVERLAY_SURFACE, "justify-end")}
        // A press on the dimmed page puts the column away; one on the rail is
        // a press on the rail, which has its own answer.
        onInteractOutside={(event) => {
          const target = event.target;
          if (
            target instanceof Node &&
            surfaceHost?.contains(target) === true
          ) {
            onOpenChange(false);
            return;
          }
          event.preventDefault();
        }}
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">{label}</DialogTitle>
        <div className="pointer-events-auto flex h-full max-w-full">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
