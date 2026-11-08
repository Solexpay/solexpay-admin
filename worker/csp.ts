/** Returns the exact per-request HTML content security policy. */
export function htmlPolicy(nonce: string): string {
  return `default-src 'none'; script-src 'self' 'nonce-${nonce}' 'strict-dynamic'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://img.logo.dev; font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'; frame-src 'none'; frame-ancestors 'none'; form-action 'self'; base-uri 'none'; object-src 'none'; upgrade-insecure-requests; report-uri /bff/csp-report`;
}

/** Adds a per-request nonce to each script and CSP headers to an HTML response. */
export function nonceHtml(response: Response): {
  response: Response;
  nonce: string;
} {
  const nonceBytes = crypto.getRandomValues(new Uint8Array(16));
  let binary = "";
  for (const byte of nonceBytes) binary += String.fromCharCode(byte);
  const nonce = btoa(binary);
  const rewritten = new HTMLRewriter()
    .on("script", {
      element(element) {
        element.setAttribute("nonce", nonce);
      },
    })
    .transform(response);
  const headers = new Headers(rewritten.headers);
  headers.set("Content-Security-Policy", htmlPolicy(nonce));
  headers.set(
    "Content-Security-Policy-Report-Only",
    "require-trusted-types-for 'script'; report-uri /bff/csp-report",
  );
  return {
    response: new Response(rewritten.body, {
      status: rewritten.status,
      statusText: rewritten.statusText,
      headers,
    }),
    nonce,
  };
}
