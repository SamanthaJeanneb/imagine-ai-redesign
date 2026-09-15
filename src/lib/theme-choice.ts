/**
 * The three choices the reader gets for the colour scheme. Distinct from
 * `THEMES` in `styles/tokens`, which is the two schemes the tokens are
 * actually defined for — "system" resolves to one of those at runtime.
 */
export const THEME_CHOICES = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
] as const;

type ThemeValue = (typeof THEME_CHOICES)[number]["value"];

/** Whatever `next-themes` hands back, narrowed to a choice we offer. */
export function toThemeValue(value: string | undefined): ThemeValue {
  return (
    THEME_CHOICES.find((theme) => theme.value === value)?.value ?? "system"
  );
}
