"use client";

import { createContext, type ReactNode, useContext } from "react";
import { createPortal } from "react-dom";

const PageAsideHostContext = createContext<HTMLElement | null>(null);

/**
 * The shell's slot for a sidebar a page owns. It sits in the shell's row
 * beside the page, under the header divider, like the chat and context
 * panels, so a page can put a full-height column there without the shell
 * knowing what it holds. The shell keeps the slot's element in state and
 * hands it down here.
 */
export function PageAsideHostProvider({
  host,
  children,
}: {
  host: HTMLElement | null;
  children: ReactNode;
}) {
  return (
    <PageAsideHostContext.Provider value={host}>
      {children}
    </PageAsideHostContext.Provider>
  );
}

/**
 * Renders its children into the shell's sidebar slot. The slot is
 * `display: contents`, so the children are the shell row's own flex items
 * and can animate their width like the other panels.
 */
export function PageAside({ children }: { children: ReactNode }) {
  const host = useContext(PageAsideHostContext);
  if (host === null) return null;
  return createPortal(children, host);
}
