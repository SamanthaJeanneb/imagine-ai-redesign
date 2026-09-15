import { cn } from "cn";

import { BrandMark, isLocalBrand } from "@/components/ui/brand-mark";
import { ICON_NAMES, type IconName } from "@/styles/icons";

/**
 * Font Awesome Pro 7 Sharp, loaded once from the Kit script (SVG + JS) in the
 * root layout. The kit nests an <svg> inside each <i>. This is the only place
 * `fa-` classes are written.
 *
 * The kit is subset. Sharp names must exist in the kit. Marks that the kit
 * does not ship (Imagine's own, Google, X, HubSpot, Slack, Salesforce, and
 * LinkedIn reaction glyphs) render from local SVGs in brand-mark.tsx so they
 * never show the missing glyph. Local marks use a <span>, not <i>: the kit
 * rewrites <i> tags and would replace a custom SVG with the missing-glyph
 * placeholder.
 *
 * The names themselves live in `styles/icons`, with the rest of the design
 * vocabulary. Re-exported here because this is where callers reach for them.
 */
export { ICON_NAMES, type IconName };

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
      <span
        data-slot="icon"
        data-size={size}
        aria-hidden="true"
        className={cn(className)}
        {...props}
      >
        <BrandMark name={name} className="size-[1em]" />
      </span>
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
