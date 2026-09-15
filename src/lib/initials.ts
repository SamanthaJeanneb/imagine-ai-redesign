/**
 * Up to two letters standing in for someone, for an avatar with no picture.
 * Splits on any run of whitespace, so a stray double space or a trailing
 * newline does not turn into an empty initial.
 */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

/**
 * The same, for a field that may hold either a name or an email address.
 * `ada.lovelace@acme.com` reads as `AL` rather than `A`.
 */
export function contactInitials(value: string): string {
  return value
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
