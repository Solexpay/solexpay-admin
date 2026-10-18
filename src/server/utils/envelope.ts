import { createError, type H3Event, getHeaders, getRequestIP } from "h3";

declare const process: { env: Record<string, string | undefined> };

export interface GoEnvelope<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errorCode?: string;
  details?: unknown;
  timestamp?: string;
  path?: string;
}

/**
 * Unwraps the Go backend HTTP response envelope per SPEC §3.4.
 * - On success: returns `data` (or empty object if 204 / void).
 * - On error: maps Go error body { errorCode, message, details } to an h3 error with the same status code.
 */
export async function unwrapGoEnvelope<T = unknown>(res: Response): Promise<T> {
  if (res.status === 204) {
    return undefined as unknown as T;
  }

  let body: unknown;
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      body = await res.json();
    } catch {
      body = null;
    }
  } else {
    try {
      const text = await res.text();
      try {
        body = JSON.parse(text);
      } catch {
        body = { message: text };
      }
    } catch {
      body = null;
    }
  }

  // Handle successful HTTP status
  if (res.ok) {
    if (body && typeof body === "object" && "success" in body) {
      const envelope = body as GoEnvelope<T>;
      if (envelope.success === false) {
        // Backend returned success: false with 200 (edge case)
        const errMsg =
          envelope.message || envelope.errorCode || "Request failed";
        throw createError({
          statusCode: res.status || 400,
          statusMessage: errMsg,
          message: errMsg,
          data: envelope,
        });
      }
      return (envelope.data !== undefined ? envelope.data : envelope) as T;
    }
    return (body !== null && body !== undefined ? body : {}) as T;
  }

  // Handle error HTTP status
  const statusCode = res.status || 500;
  const errBody =
    body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  const message =
    (typeof errBody?.["message"] === "string"
      ? errBody["message"]
      : undefined) ||
    (typeof errBody?.["errorCode"] === "string"
      ? errBody["errorCode"]
      : undefined) ||
    res.statusText ||
    "Backend error";

  throw createError({
    statusCode,
    statusMessage: message,
    message,
    data: body ?? { errorCode: "INTERNAL_ERROR", message },
  });
}

/** Alias for unwrapGoEnvelope */
export const unwrapBackendResponse = unwrapGoEnvelope;

/**
 * The caller's IP as the backend should see it. The first X-Forwarded-For
 * entry is whatever the browser sent, so it is never trusted: behind our own
 * reverse proxy (BFF_BEHIND_PROXY=true) the client is the LAST entry, the one
 * that proxy appended; otherwise it is the socket peer.
 */
export function resolveClientIP(event: H3Event): string | undefined {
  if (process.env["BFF_BEHIND_PROXY"] === "true") {
    const xff = getHeaders(event)["x-forwarded-for"];
    const last = xff
      ?.split(",")
      .map((p) => p.trim())
      .filter(Boolean)
      .pop();
    if (last) return last;
  }
  try {
    return getRequestIP(event);
  } catch {
    // no socket attached (mock events)
    return undefined;
  }
}

/**
 * Extracts and forwards headers from the incoming H3 event to the backend:
 * - Authorization (Bearer token)
 * - X-Idempotency-Key
 * - X-Forwarded-For (client IP, see resolveClientIP)
 * - User-Agent
 */
export function forwardHeaders(
  event: H3Event,
  extra: Record<string, string> = {},
): Record<string, string> {
  const incoming = getHeaders(event);
  const out: Record<string, string> = { ...extra };

  if (incoming["authorization"]) {
    out["Authorization"] = incoming["authorization"];
  }

  const idempotencyKey =
    incoming["x-idempotency-key"] || incoming["X-Idempotency-Key"];
  if (idempotencyKey) {
    out["X-Idempotency-Key"] = idempotencyKey;
  }

  const clientIP = resolveClientIP(event);
  if (clientIP) {
    out["X-Forwarded-For"] = clientIP;
  }

  const userAgent = incoming["user-agent"] || incoming["User-Agent"];
  if (userAgent) {
    out["User-Agent"] = userAgent;
  }

  return out;
}

/**
 * Builds a clean query string from allowed parameters, stripping undefined, null, and empty strings.
 */
export function buildQueryString(
  query: Record<string, unknown>,
  allowedKeys?: string[],
): string {
  const params = new URLSearchParams();
  const keys = allowedKeys || Object.keys(query);

  for (const key of keys) {
    const val = query[key];
    if (val !== undefined && val !== null && val !== "") {
      params.set(key, String(val).trim());
    }
  }

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Helper to call the backend and unwrap its envelope in one step.
 */
export async function callBackend<T = unknown>(
  event: H3Event,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const baseUrl = (process.env["API_URL"] || "").replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${baseUrl}${cleanPath}`;

  const headers = forwardHeaders(event, {
    ...(init.body ? { "Content-Type": "application/json" } : {}),
    ...((init.headers as Record<string, string>) || {}),
  });

  const res = await fetch(url, {
    ...init,
    headers,
  });

  return unwrapGoEnvelope<T>(res);
}
