/**
 * School logos are resolved by the backend (Logo.dev from the school's web
 * domain, or an admin override) and arrive as `logoUrl`. Nothing is
 * hardcoded here: no URL means the UI shows the school's initials.
 */
export function schoolLogo(school: { logoUrl?: string | null }): string | null {
  const url = school.logoUrl?.trim();
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? parsed.href : null;
  } catch {
    return null;
  }
}

/** Up to two initials for the logo fallback, e.g. "University of Lagos" → "UL". */
export function schoolInitials(name: string): string {
  const words = name
    .split(/\s+/)
    .filter((word) => word.length > 0 && !/^(of|the|and|&)$/i.test(word));
  return (
    words
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}
