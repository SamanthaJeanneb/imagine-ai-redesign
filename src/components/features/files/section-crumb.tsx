"use client";

import type { DragEvent } from "react";

import type { FileSection } from "@/components/features/files/file-tree";
import { BreadcrumbLink } from "@/components/ui/breadcrumb";

/**
 * A library in a breadcrumb: goes there on click, and takes a dropped item
 * back up out of whatever folder it is in.
 */
export function SectionCrumbLink({
  section,
  active,
  onSelect,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  section: FileSection;
  /** Something movable is over the crumb. */
  active: boolean;
  onSelect: () => void;
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onDragLeave: (event: DragEvent<HTMLElement>) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
}) {
  return (
    <BreadcrumbLink
      onClick={onSelect}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={active ? "text-imagine-secondary" : undefined}
    >
      {section.title}
    </BreadcrumbLink>
  );
}
