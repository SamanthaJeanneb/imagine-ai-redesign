/**
 * Imagine design tokens: the single source of truth for color, spacing, radius,
 * and type. `tokensToCss()` emits them as `--imagine-*` CSS variables, which
 * `globals.css` maps into Tailwind utilities via `@theme inline`.
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
  | "secondary-foreground";

export const colors = {
  light: {
    background: "#f4f2f0",
    surface: "#ffffff",
    "surface-raised": "#f4f2f0",
    border: "#eae5e3",
    foreground: "#161516",
    "foreground-muted": "#6b6661",
    "foreground-faint": "#b9b3af",
    primary: "#161516",
    "primary-foreground": "#f4f2f0",
    secondary: "#d4707c",
    "secondary-soft": "#d4707c29",
    "secondary-strong": "#c2606c",
    "secondary-foreground": "#ffffff",
  },
  dark: {
    background: "#1a1817",
    surface: "#1f1e20",
    "surface-raised": "#2b2a2c",
    border: "#2b2a2c",
    foreground: "#f4f2f0",
    "foreground-muted": "#a09a94",
    "foreground-faint": "#6b6661",
    primary: "#f4f2f0",
    "primary-foreground": "#1a1817",
    secondary: "#d4707c",
    "secondary-soft": "#d4707c3d",
    "secondary-strong": "#e0838d",
    "secondary-foreground": "#ffffff",
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

export type SpacingToken =
  "xxs" | "xs" | "s" | "m" | "l" | "xl" | "xxl" | "xxxl" | "section";

/** Pixels. */
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

export type TypeToken =
  "display" | "title" | "heading" | "body" | "small" | "micro";

interface TypeStyle {
  /** Pixels. */
  size: number;
  /** Pixels. */
  lineHeight: number;
  /** Em. */
  letterSpacing?: number;
}

export const type = {
  display: { size: 28, lineHeight: 34 },
  title: { size: 20, lineHeight: 28 },
  heading: { size: 16, lineHeight: 24 },
  body: { size: 14, lineHeight: 22 },
  small: { size: 12, lineHeight: 16 },
  micro: { size: 11, lineHeight: 14, letterSpacing: 0.04 },
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

function scaleDeclarations(): string {
  const entries: (readonly [string, string])[] = [];
  for (const [name, px] of Object.entries(spacing)) {
    entries.push([`spacing-${name}`, `${String(px)}px`]);
  }
  for (const [name, px] of Object.entries(radius)) {
    entries.push([`radius-${name}`, `${String(px)}px`]);
  }
  for (const [name, style] of Object.entries(type)) {
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
    `:root{${scaleDeclarations()};${colorDeclarations("light")};${shadowDeclarations("light")}}`,
    `[data-theme="dark"]{${colorDeclarations("dark")};${shadowDeclarations("dark")}}`,
  ].join("\n");
}
