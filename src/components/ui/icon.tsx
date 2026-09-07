import { cn } from "cn";

/**
 * Font Awesome Pro 7 Sharp, loaded once from the Kit script (SVG + JS) in the
 * root layout. The kit nests an <svg> inside each <i>. This is the only place
 * `fa-` classes are written.
 *
 * Names come from the Sharp Regular set:
 * https://fontawesome.com/search?ip=sharp&s=regular
 */
export const ICON_NAMES = [
  "arrow-down",
  "arrow-left",
  "arrow-right",
  "arrow-up",
  "arrow-up-right-from-square",
  "bell",
  "bolt",
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
  "circle-notch",
  "circle-plus",
  "circle-xmark",
  "clock",
  "comment",
  "copy",
  "download",
  "ellipsis",
  "envelope",
  "expand",
  "eye",
  "file-lines",
  "folder",
  "gear",
  "globe",
  "google",
  "grid-2",
  "hashtag",
  "hubspot",
  "image",
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
  "play",
  "plug",
  "plus",
  "retweet",
  "rotate",
  "salesforce",
  "sidebar",
  "slack",
  "sparkles",
  "sun",
  "thumbs-up",
  "trash",
  "triangle-exclamation",
  "upload",
  "user",
  "users",
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
