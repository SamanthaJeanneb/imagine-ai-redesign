import { cn } from "cn";

/**
 * Font Awesome Pro 7 Sharp, loaded once from the Kit stylesheet in the root
 * layout. This is the only place `fa-` classes are written.
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
  "circle-xmark",
  "clock",
  "copy",
  "ellipsis",
  "expand",
  "eye",
  "file-lines",
  "folder",
  "gear",
  "image",
  "link",
  "linkedin-in",
  "magnifying-glass",
  "message",
  "moon",
  "paperclip",
  "pen",
  "plus",
  "rotate",
  "sidebar",
  "sparkles",
  "sun",
  "trash",
  "triangle-exclamation",
  "user",
  "xmark",
] as const;

export type IconName = (typeof ICON_NAMES)[number];

/** Sizes follow the type scale: s 12, m 14, l 16, xl 20. */
export type IconSize = "s" | "m" | "l" | "xl";

const BRAND_ICONS: ReadonlySet<IconName> = new Set<IconName>(["linkedin-in"]);

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
