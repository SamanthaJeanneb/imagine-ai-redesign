/**
 * Imagine design tokens: the single source of truth for color, spacing, sizing,
 * radius, and type. `tokensToCss()` emits them as `--imagine-*` CSS variables,
 * which `globals.css` maps into Tailwind utilities via `@theme inline`.
 *
 * Nothing downstream picks its own values. Tailwind's own scales are folded onto
 * these tokens, so the plain utilities resolve here too:
 *
 * - `--spacing` comes from `spacingBase`, so every numeric utility (`p-4`,
 *   `gap-1.5`, `h-9`, `size-8`, `w-64`) is a multiple of one token.
 * - `--text-xs|sm|base|lg` come from `typeScale`, so the vendored shadcn
 *   primitives track the type scale instead of sitting a step behind.
 * - `--radius-*` and `--color-*`, including the state colors, come from here.
 * - Control heights live in `control` and are used as `h-control-*`, so buttons,
 *   inputs, selects, tab strips, and toggle groups stay one family.
 *
 * Changing a number here changes every component that uses it. Editing a size,
 * color, or font anywhere else is a bug.
 *
 * Color values were sampled from `pallete-light.png`, `pallete-dark.png`, and
 * `pink-application.png`. Names describe the role, never the hue.
 */

export type Theme = "light" | "dark";

export const THEMES = ["light", "dark"] as const satisfies readonly Theme[];

export type ColorToken =
  | "background"
  | "surface"
  | "surface-raised"
  | "border"
  | "foreground"
  | "foreground-muted"
  | "foreground-faint"
  | "primary"
  | "primary-foreground"
  | "secondary"
  | "secondary-soft"
  | "secondary-strong"
  | "secondary-foreground"
  | "destructive"
  | "warning"
  | "success"
  | "tag-1"
  | "tag-2"
  | "tag-3"
  | "tag-4"
  | "tag-5";

/**
 * Categorical accents for post labels on the calendar. Numbered, not named for
 * a hue, because a label picks one by position in the organization's list.
 * Mid tones: light enough to tint a chip, deep enough to carry white text.
 */
export const TAG_TONES = [1, 2, 3, 4, 5] as const;

export type TagTone = (typeof TAG_TONES)[number];

export const colors = {
  light: {
    background: "#f4f2f0",
    surface: "#ffffff",
    "surface-raised": "#f4f2f0",
    border: "#eae5e3",
    foreground: "#161516",
    "foreground-muted": "#6b6661",
    "foreground-faint": "#b9b3af",
    primary: "#3d3a38",
    "primary-foreground": "#f4f2f0",
    secondary: "#d4707c",
    "secondary-soft": "#d4707c29",
    "secondary-strong": "#c2606c",
    "secondary-foreground": "#ffffff",
    destructive: "#dc2626",
    warning: "#d97706",
    success: "#059669",
    "tag-1": "#7b5cd6",
    "tag-2": "#2f9e63",
    "tag-3": "#3b82c4",
    "tag-4": "#c07a2c",
    "tag-5": "#1f9aa8",
  },
  dark: {
    // Sidebar is the warmer, lighter charcoal; the page sits darker so the
    // rail reads as chrome and body text can go full white.
    background: "#231f1e",
    surface: "#151515",
    "surface-raised": "#36312f",
    border: "#2c2827",
    foreground: "#ffffff",
    "foreground-muted": "#908d8c",
    "foreground-faint": "#6a6563",
    primary: "#5c5754",
    "primary-foreground": "#ffffff",
    secondary: "#d4707c",
    "secondary-soft": "#d4707c3d",
    "secondary-strong": "#e0838d",
    "secondary-foreground": "#ffffff",
    destructive: "#f87171",
    warning: "#fbbf24",
    success: "#34d399",
    "tag-1": "#9b84e8",
    "tag-2": "#4cc082",
    "tag-3": "#5ca1e0",
    "tag-4": "#d99a4e",
    "tag-5": "#3fb8c6",
  },
} as const satisfies Record<Theme, Record<ColorToken, string>>;

export type ShadowToken = "control" | "raised" | "floating" | "highlight";

/**
 * Elevation. Controls get a hairline ring plus a whisper of drop shadow so
 * they read as physical without a drawn border. `highlight` is an inset top
 * sheen for primary surfaces. Dark mode leans on the inset light instead of
 * drop shadows, which vanish on dark backgrounds.
 */
export const shadows = {
  light: {
    control: "0 0 0 1px rgb(22 21 22 / 0.05), 0 1px 2px rgb(22 21 22 / 0.06)",
    raised:
      "0 0 0 1px rgb(22 21 22 / 0.04), 0 1px 2px rgb(22 21 22 / 0.04), 0 8px 24px -12px rgb(22 21 22 / 0.18)",
    floating:
      "0 0 0 1px rgb(22 21 22 / 0.05), 0 2px 6px -2px rgb(22 21 22 / 0.08), 0 16px 40px -16px rgb(22 21 22 / 0.24)",
    highlight: "inset 0 1px 0 rgb(255 255 255 / 0.14)",
  },
  dark: {
    control: "0 0 0 1px rgb(255 255 255 / 0.06), 0 1px 2px rgb(0 0 0 / 0.4)",
    raised:
      "0 0 0 1px rgb(255 255 255 / 0.05), 0 8px 24px -12px rgb(0 0 0 / 0.6)",
    floating:
      "0 0 0 1px rgb(255 255 255 / 0.07), 0 16px 40px -16px rgb(0 0 0 / 0.7)",
    highlight: "inset 0 1px 0 rgb(255 255 255 / 0.08)",
  },
} as const satisfies Record<Theme, Record<ShadowToken, string>>;

/**
 * The unit every numeric Tailwind utility multiplies: `p-2` is two of these,
 * `h-9` is nine. `globals.css` feeds it to Tailwind's `--spacing`, so changing
 * this one number changes the density of the whole app.
 */
export const spacingBase = 4;

export type SpacingToken =
  "xxs" | "xs" | "s" | "m" | "l" | "xl" | "xxl" | "xxxl" | "section";

/** Named steps for layout, on top of `spacingBase`. Pixels. */
export const spacing = {
  xxs: 2,
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  section: 64,
} as const satisfies Record<SpacingToken, number>;

export type RadiusToken = "control" | "panel" | "surface";

/** Pixels. */
export const radius = {
  control: 6,
  panel: 12,
  surface: 20,
} as const satisfies Record<RadiusToken, number>;

export type ControlToken = "xs" | "sm" | "base" | "lg";

/**
 * Control heights, in pixels. Buttons, inputs, selects, tab strips, and toggle
 * groups all size from these, so controls stay one family and one edit here
 * retunes every one of them. Sized to sit comfortably around the type scale.
 */
export const control = {
  xs: 28,
  sm: 32,
  base: 36,
  lg: 40,
} as const satisfies Record<ControlToken, number>;

/** Half the default scale. Used by `/dev/kit-sharp` via `[data-radius="sharp"]`. */
export const radiusSharp = {
  control: 2,
  panel: 4,
  surface: 8,
} as const satisfies Record<RadiusToken, number>;

export type TypeToken =
  "display" | "title" | "heading" | "body" | "small" | "caption" | "micro";

interface TypeStyle {
  /** Pixels. */
  size: number;
  /** Pixels. */
  lineHeight: number;
  /** Em. */
  letterSpacing?: number;
}

/** Named `typeScale`, not `type`, so it can be imported without colliding with
 *  TypeScript's `import { type X }` modifier. */
export const typeScale = {
  display: { size: 32, lineHeight: 40 },
  title: { size: 24, lineHeight: 32 },
  heading: { size: 18, lineHeight: 26 },
  body: { size: 16, lineHeight: 24 },
  small: { size: 14, lineHeight: 20 },
  /** Dense running text, as on a calendar chip. Same size as micro, but sentence case. */
  caption: { size: 12, lineHeight: 16 },
  micro: { size: 12, lineHeight: 16, letterSpacing: 0.04 },
} as const satisfies Record<TypeToken, TypeStyle>;

function declarations(entries: readonly (readonly [string, string])[]): string {
  return entries.map(([name, value]) => `--imagine-${name}:${value}`).join(";");
}

function colorDeclarations(theme: Theme): string {
  return declarations(Object.entries(colors[theme]));
}

function shadowDeclarations(theme: Theme): string {
  return declarations(
    Object.entries(shadows[theme]).map(
      ([name, value]) => [`shadow-${name}`, value] as const,
    ),
  );
}

function radiusDeclarations(scale: Record<RadiusToken, number>): string {
  return declarations(
    Object.entries(scale).map(
      ([name, px]) => [`radius-${name}`, `${String(px)}px`] as const,
    ),
  );
}

function scaleDeclarations(): string {
  const entries: (readonly [string, string])[] = [
    ["spacing-base", `${String(spacingBase)}px`],
  ];
  for (const [name, px] of Object.entries(spacing)) {
    entries.push([`spacing-${name}`, `${String(px)}px`]);
  }
  for (const [name, px] of Object.entries(control)) {
    entries.push([`control-${name}`, `${String(px)}px`]);
  }
  for (const [name, style] of Object.entries(typeScale)) {
    entries.push([`text-${name}-size`, `${String(style.size)}px`]);
    entries.push([`text-${name}-line-height`, `${String(style.lineHeight)}px`]);
    entries.push([
      `text-${name}-letter-spacing`,
      "letterSpacing" in style ? `${String(style.letterSpacing)}em` : "0",
    ]);
  }
  return declarations(entries);
}

/**
 * CSS that defines every `--imagine-*` variable. Light is the default on
 * `:root`; dark switches on `[data-theme="dark"]`.
 */
export function tokensToCss(): string {
  return [
    `:root{${scaleDeclarations()};${radiusDeclarations(radius)};${colorDeclarations("light")};${shadowDeclarations("light")}}`,
    `[data-theme="dark"]{${colorDeclarations("dark")};${shadowDeclarations("dark")}}`,
    `[data-radius="sharp"]{${radiusDeclarations(radiusSharp)}}`,
  ].join("\n");
}
