import type { Env } from "./env";

/** Inputs for a signed backend request. */
export interface GatewayRequest {
  request: Request;
  env: Env;
  requestId: string;
  pathWithQuery: string;
  method: string;
  body?: string;
  accessToken?: string;
  refreshToken?: string;
  purpose?: string | null;
  idempotencyKey?: string;
}

/** HMAC-signs and sends a request to the Go backend without forwarding browser headers. */
export async function gatewayFetch(input: GatewayRequest): Promise<Response> {
  const ts = Math.floor(Date.now() / 1000).toString();
  const clientIp = input.request.headers.get("CF-Connecting-IP") || "0.0.0.0";
  // The request id is signed too: two identical requests in the same second
  // must not share a signature, or the backend's replay guard rejects one.
  const material = `${ts}\n${input.method}\n${input.pathWithQuery}\n${clientIp}\n${input.requestId}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(input.env.GATEWAY_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(material)),
  );
  const sig = Array.from(signature, (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  const headers = new Headers({
    "X-SX-Gateway-Ts": ts,
    "X-SX-Gateway-Sig": sig,
    "X-SX-Client-IP": clientIp,
    "X-Request-Id": input.requestId,
    "User-Agent": (input.request.headers.get("User-Agent") || "").slice(0, 256),
    Accept: "application/json",
  });
  if (input.body !== undefined) headers.set("Content-Type", "application/json");
  if (input.accessToken)
    headers.set("Authorization", `Bearer ${input.accessToken}`);
  if (input.refreshToken)
    headers.set("Cookie", `__Host-sx_admin_rt=${input.refreshToken}`);
  if (input.purpose === "export") headers.set("X-Admin-Purpose", "export");
  if (input.idempotencyKey)
    headers.set("X-Idempotency-Key", input.idempotencyKey);
  const url = `${input.env.API_ORIGIN.replace(/\/+$/, "")}${input.pathWithQuery}`;
  const signal = AbortSignal.timeout(15000);
  try {
    const response = await fetch(url, {
      method: input.method,
      headers,
      body: input.body,
      redirect: "manual",
      signal,
    });
    if (response.status >= 300 && response.status < 400)
      return new Response(null, { status: 502 });
    return response;
  } catch (error) {
    if (
      signal.aborted ||
      (error instanceof DOMException && error.name === "TimeoutError")
    )
      return new Response(null, { status: 504 });
    throw error;
  }
}

/** Reads a backend response body only while it stays within the supplied cap. */
export async function readLimitedBody(
  response: Response,
  max: number,
): Promise<Uint8Array<ArrayBuffer> | null> {
  if (!response.body) return new Uint8Array(0);
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    length += part.value.byteLength;
    if (length > max) {
      await reader.cancel();
      return null;
    }
    chunks.push(part.value);
  }
  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

/** Extracts all individual Set-Cookie header values across runtimes. */
export function setCookieValues(headers: Headers): string[] {
  const extended = headers as Headers & { getSetCookie?: () => string[] };
  if (extended.getSetCookie) return extended.getSetCookie();
  const value = headers.get("Set-Cookie");
  return value ? [value] : [];
}

/** Finds the backend refresh cookie value in Set-Cookie headers. */
export function refreshTokenFromHeaders(headers: Headers): string | null {
  for (const cookie of setCookieValues(headers)) {
    const match = cookie.match(/(?:^|,\s*)__Host-sx_admin_rt=([^;,\s]+)/);
    if (match) return match[1];
  }
  return null;
}
