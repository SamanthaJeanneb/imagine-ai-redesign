"use client";

import { useEffect } from "react";

/**
 * Puts `data-radius="sharp"` on `<html>` so every token, including menus
 * portaled to `body`, reads the tighter scale. The matching inline script
 * in the layout sets it before paint; this keeps it on and clears it when
 * you leave the page.
 */
export function RadiusScope() {
  useEffect(() => {
    document.documentElement.dataset["radius"] = "sharp";
    return () => {
      delete document.documentElement.dataset["radius"];
    };
  }, []);

  return null;
}
