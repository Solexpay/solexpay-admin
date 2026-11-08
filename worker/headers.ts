import { htmlPolicy } from "./csp";

const SECURITY: Record<string, string> = {
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "credentialless",
  "Origin-Agent-Cluster": "?1",
  "Permissions-Policy":
    "accelerometer=(), autoplay=(), camera=(), display-capture=(), encrypted-media=(), fullscreen=(self), geolocation=(), gyroscope=(), hid=(), magnetometer=(), microphone=(), midi=(), payment=(), publickey-credentials-get=(), screen-wake-lock=(), serial=(), usb=(), xr-spatial-tracking=(), clipboard-write=(self), browsing-topics=()",
  "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet, noimageindex",
  "X-DNS-Prefetch-Control": "off",
  "X-Permitted-Cross-Domain-Policies": "none",
};

/** Applies common security, CSP, and cache headers to every response. */
export function applySecurityHeaders(
  response: Response,
  options: { nonce?: string; isHtml: boolean; path?: string },
): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY)) headers.set(key, value);
  headers.delete("Server");
  headers.delete("X-Powered-By");
  if (options.isHtml) {
    headers.set("Cache-Control", "no-store");
    if (options.nonce) {
      headers.set("Content-Security-Policy", htmlPolicy(options.nonce));
      headers.set(
        "Content-Security-Policy-Report-Only",
        "require-trusted-types-for 'script'; report-uri /bff/csp-report",
      );
    }
  } else {
    headers.set(
      "Content-Security-Policy",
      "default-src 'none'; frame-ancestors 'none'; sandbox",
    );
    if (options.path?.startsWith("/bff/"))
      headers.set("Cache-Control", "no-store");
    else if (options.path?.startsWith("/_next/static/"))
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
    else headers.set("Cache-Control", "public, max-age=3600");
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
