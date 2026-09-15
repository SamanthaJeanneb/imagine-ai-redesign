/** LinkedIn addresses as they are pasted in, and what they say. */

/** "https://www.linkedin.com/in/jane-doe/" → "linkedin.com/in/jane-doe". */
export function normalizeLinkedInUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/+$/, "");
}

/** Company pages live under `/company/`; people under `/in/`. */
export function linkedInProfileKind(url: string): "company" | "person" {
  return url.includes("/company/") ? "company" : "person";
}

/** "linkedin.com/in/jane-doe" → "Jane Doe"; "/company/acme-labs" → "Acme Labs". */
export function nameFromLinkedInUrl(url: string): string {
  const slug =
    url
      .replace(/\/+$/, "")
      .split("/")
      .filter((part) => part !== "")
      .at(-1) ?? "";
  const words = slug
    .split(/[-_.]+/)
    .filter((part) => part !== "" && !/^\d+$/.test(part))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1));
  return words.length === 0 ? "New profile" : words.join(" ");
}
