/**
 * Only same-origin paths are allowed after sign-in. "/\\evil.com" and
 * "//evil.com" both resolve to another origin, so the check parses the URL
 * instead of looking at prefixes.
 */
export function safeReturnUrl(target: string | null): string {
  if (!target?.startsWith("/")) return "/dashboard";
  try {
    const base = window.location.origin;
    const url = new URL(target, base);
    if (url.origin !== base || url.pathname.startsWith("/login"))
      return "/dashboard";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/dashboard";
  }
}
