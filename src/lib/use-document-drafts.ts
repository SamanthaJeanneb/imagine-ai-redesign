"use client";

import { useState } from "react";

/** Anything with text that can be edited away from what it was opened with. */
interface DraftDocument {
  id: string;
  value: string;
}

/**
 * What the reader has typed into each open document, and what they have saved.
 *
 * Both are sparse: a document absent from either map has not been touched, so
 * every read falls back to the document's own value. That keeps a document
 * that arrives later correct, which prefilling the maps on first render does
 * not — the prefill would be taken once and never catch up.
 */
export function useDocumentDrafts() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, string>>({});

  function valueOf(document: DraftDocument): string {
    return values[document.id] ?? document.value;
  }

  function savedValueOf(document: DraftDocument): string {
    return saved[document.id] ?? document.value;
  }

  return {
    valueOf,
    savedValueOf,
    /** Whether the tab should show its unsaved mark. */
    isDirty(document: DraftDocument): boolean {
      return valueOf(document) !== savedValueOf(document);
    },
    change(document: DraftDocument, value: string) {
      setValues((current) => ({ ...current, [document.id]: value }));
    },
    save(document: DraftDocument) {
      setSaved((current) => ({ ...current, [document.id]: valueOf(document) }));
    },
  };
}
