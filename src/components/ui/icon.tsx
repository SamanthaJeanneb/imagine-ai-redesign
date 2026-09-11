import { cn } from "cn";

import { BrandMark, isLocalBrand } from "@/components/ui/brand-mark";

/**
 * Font Awesome Pro 7 Sharp, loaded once from the Kit script (SVG + JS) in the
 * root layout. The kit nests an <svg> inside each <i>. This is the only place
 * `fa-` classes are written.
 *
 * The kit is subset. Sharp names must exist in the kit. Marks that the kit
 * does not ship (Imagine's own, Google, X, HubSpot, Slack, Salesforce) render
 * from local SVGs in brand-mark.tsx so they never show the missing glyph.
 */
export const ICON_NAMES = [
  "arrow-down",
  "arrow-left",
  "arrow-right",
  "arrow-up",
  "arrows-rotate",
  "bell",
  "bookmark",
  "building",
  "calendar",
  "chart-simple",
  "check",
  "chevron-down",
  "chevron-left",
  "chevron-right",
  "chevron-up",
  "circle-check",
  "circle-info",
  "circle-xmark",
  "clock",
  "clock-rotate-left",
  "cloud-arrow-up",
  "comment",
  "copy",
  "download",
  "ellipsis",
  "envelope",
  "expand",
  "eye",
  "file-lines",
  "file-pen",
  "file-plus",
  "folder",
  "folder-open",
  "folder-plus",
  "gear",
  "globe",
  "google",
  "grip",
  "heart",
  "hubspot",
  "image",
  "imagine",
  "key",
  "link",
  "linkedin-in",
  "list",
  "lock",
  "magnifying-glass",
  "message",
  "minus",
  "moon",
  "paper-plane",
  "paperclip",
  "pen",
  "pen-to-square",
  "plug",
  "plus",
  "puzzle-piece",
  "salesforce",
  "share-nodes",
  "sidebar",
  "slack",
  "spinner",
  "sun",
  "thumbs-up",
  "trash",
  "triangle-exclamation",
  "up-right-from-square",
  "upload",
  "user",
  "users",
  "video",
  "x-twitter",
  "xmark",
] as const;

export type IconName = (typeof ICON_NAMES)[number];

/** Sizes follow the type scale: s 12, m 14, l 16, xl 20. */
export type IconSize = "s" | "m" | "l" | "xl";

const BRAND_ICONS: ReadonlySet<IconName> = new Set<IconName>([
  "google",
  "hubspot",
  "linkedin-in",
  "salesforce",
  "slack",
  "x-twitter",
]);

interface IconProps extends Omit<React.ComponentProps<"i">, "children"> {
  name: IconName;
  size?: IconSize;
  /** Sharp Solid, for active/selected states only. */
  active?: boolean;
}

export function Icon({
  name,
  size = "m",
  active = false,
  className,
  ...props
}: IconProps) {
  if (isLocalBrand(name)) {
    return (
      <i
        data-slot="icon"
        data-size={size}
        aria-hidden="true"
        className={cn(className)}
        {...props}
      >
        <BrandMark name={name} className="size-[1em]" />
      </i>
    );
  }

  const family = BRAND_ICONS.has(name)
    ? "fa-brands"
    : active
      ? "fa-sharp fa-solid"
      : "fa-sharp fa-regular";

  return (
    <i
      data-slot="icon"
      data-size={size}
      aria-hidden="true"
      className={cn(family, `fa-${name}`, className)}
      {...props}
    />
  );
}
