import { z } from "zod";

const forbiddenChars =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;
const safeKey = /^[A-Za-z0-9_.-]{1,64}$/;

/** Sanitises text using the shared request string rules. */
export function sanitizeString(value: string, max = 10000): string {
  const cleaned = value.normalize("NFC").replace(forbiddenChars, "").trim();
  if (cleaned.length > max) throw new Error("invalid");
  return cleaned;
}

/** Secret-bearing keys passed through byte-for-byte (only length-checked): normalising or trimming would change the credential. */
const VERBATIM_KEYS = new Set(["password", "currentPassword", "newPassword"]);

/** Builds a safe fresh JSON value while enforcing structural limits. */
export function sanitize(value: unknown, depth = 0, key = ""): unknown {
  if (depth > 8) throw new Error("invalid");
  if (typeof value === "string") {
    if (VERBATIM_KEYS.has(key)) {
      if (value.length > 256) throw new Error("invalid");
      return value;
    }
    return sanitizeString(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("invalid");
    return value;
  }
  if (value === null || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    if (value.length > 1000) throw new Error("invalid");
    return value.map((item) => sanitize(item, depth + 1));
  }
  if (typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length > 200) throw new Error("invalid");
    const result: Record<string, unknown> = Object.create(null) as Record<
      string,
      unknown
    >;
    for (const [key, item] of entries) {
      if (
        !safeKey.test(key) ||
        key === "__proto__" ||
        key === "constructor" ||
        key === "prototype"
      )
        throw new Error("invalid");
      result[key] = sanitize(item, depth + 1, key);
    }
    return result;
  }
  throw new Error("invalid");
}

/** Reads a bounded JSON object from a request. */
export async function readJsonBody(
  request: Request,
  limit: number,
): Promise<Record<string, unknown>> {
  const contentType =
    request.headers.get("Content-Type")?.trim().toLowerCase() || "";
  if (!/^application\/json(?:\s*;|$)/.test(contentType))
    throw new TypeError("unsupported");
  const length = request.headers.get("Content-Length");
  if (length && (!/^\d+$/.test(length) || Number(length) > limit))
    throw new RangeError("large");
  if (!request.body) throw new Error("invalid");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    total += part.value.byteLength;
    if (total > limit) {
      await reader.cancel();
      throw new RangeError("large");
    }
    chunks.push(part.value);
  }
  try {
    const all = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      all.set(chunk, offset);
      offset += chunk.length;
    }
    const parsed: unknown = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(all),
    );
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))
      throw new Error("invalid");
    const clean = sanitize(parsed);
    if (typeof clean !== "object" || clean === null || Array.isArray(clean))
      throw new Error("invalid");
    return clean as Record<string, unknown>;
  } catch {
    throw new Error("invalid");
  }
}

/** Strict request schema for admin login. */
export const loginSchema = z
  .object({
    email: z.email().max(254).toLowerCase(),
    password: z.string().min(1).max(256),
  })
  .strict();
/** Strict request schema for TOTP enrollment. */
export const enrollSchema = z
  .object({ enrollmentToken: z.string().min(16).max(4096) })
  .strict();
/** Strict request schema for TOTP confirmation. */
export const confirmSchema = z
  .object({
    enrollmentToken: z.string().min(16).max(4096),
    code: z.string().regex(/^\d{6}$/),
  })
  .strict();

/** Sanitises and reconstructs a bounded query string. */
export function sanitizeQuery(search: string): string {
  if (search.length > 2048) throw new Error("invalid");
  if (/%(?![0-9a-f]{2})/i.test(search)) throw new Error("invalid");
  const params = new URLSearchParams(search);
  const pairs = Array.from(params.entries());
  if (pairs.length > 30) throw new Error("invalid");
  const rebuilt = new URLSearchParams();
  for (const [key, value] of pairs) {
    if (!/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(key)) throw new Error("invalid");
    rebuilt.append(key, sanitizeString(value, 512));
  }
  return rebuilt.toString();
}

/** Validates the supported admin API path shape. */
export function validApiPath(path: string): boolean {
  if (/^\/admin(\/[A-Za-z0-9_-]{1,128}){1,8}\/?$/.test(path)) return true;
  // Loan ops routes are mounted outside /admin on the backend (loan.RegisterOps).
  return /^\/loans\/(ops-pending|[A-Za-z0-9-]{1,64}\/ops-(approve|reject))$/.test(
    path,
  );
}

/** Validates an optional X-Idempotency-Key header (admin broadcast etc.); throws when malformed. */
export function idempotencyKey(value: string | null): string | undefined {
  if (value === null || value === "") return undefined;
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(value)) throw new Error("invalid");
  return value;
}

/** Checks the same-origin mutation and fetch-metadata CSRF contract. */
export function csrfAllowed(request: Request): boolean {
  const url = new URL(request.url);
  if (request.method === "GET" || request.method === "HEAD")
    return request.headers.get("Sec-Fetch-Site") !== "cross-site";
  return (
    request.headers.get("Origin") === url.origin &&
    (!request.headers.has("Sec-Fetch-Site") ||
      request.headers.get("Sec-Fetch-Site") === "same-origin") &&
    request.headers.get("X-SX-CSRF") === "1"
  );
}

/** Returns a standard non-reflective validation error response. */
export function validationResponse(): Response {
  return Response.json(
    {
      success: false,
      errorCode: "VALIDATION_ERROR",
      message: "Invalid request.",
    },
    { status: 400 },
  );
}
