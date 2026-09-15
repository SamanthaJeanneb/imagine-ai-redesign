"use client";

import type { FileSection } from "@/components/features/files/file-tree";
import { useFilesLibrary } from "@/components/features/files/files-library-provider";
import { BreadcrumbLink } from "@/components/ui/breadcrumb";

/**
 * A library in a breadcrumb: goes there on click, and takes a dropped item
 * back up out of whatever folder it is in.
 */
export function SectionCrumbLink({
  section,
  onSelect,
}: {
  section: FileSection;
  onSelect: () => void;
}) {
  const library = useFilesLibrary();
  const dest = { sectionId: section.id };
  const key = `crumb:${section.id}`;

  return (
    <BreadcrumbLink
      onClick={onSelect}
      onDragOver={library.overMoveDest(dest, key)}
      onDragLeave={library.leaveMoveDest(key)}
      onDrop={library.dropMoveDest(dest)}
      className={
        library.dropTargetId === key ? "text-imagine-secondary" : undefined
      }
    >
      {section.title}
    </BreadcrumbLink>
  );
}
